/**
 * Load Testing Script for GlimmoraTeam APIs
 * 
 * Usage:
 *   node load-test.js --concurrent 5 --duration 60 --ramp-up 10
 * 
 * Options:
 *   --concurrent <num>  Number of concurrent requests (default: 1)
 *   --duration <sec>    Duration of test in seconds (default: 30)
 *   --ramp-up <sec>     Ramp-up time in seconds (default: 0)
 *   --base-url <url>    API base URL (default: http://localhost:9000)
 *   --verbose          Enable verbose logging
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  concurrent: parseInt(getArg('--concurrent', '1')),
  duration: parseInt(getArg('--duration', '30')),
  rampUp: parseInt(getArg('--ramp-up', '0')),
  baseUrl: getArg('--base-url', 'http://localhost:9000'),
  verbose: args.includes('--verbose'),
};

function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  return index > -1 && index < args.length - 1 ? args[index + 1] : defaultValue;
}

// Test configuration
const TEST_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/auth/me', name: 'Get Current User', requiresAuth: true },
  { method: 'GET', path: '/api/v1/sows', name: 'List SOWs', requiresAuth: true },
  { method: 'POST', path: '/api/v1/auth/login', name: 'Login', requiresAuth: false, body: { email: 'test@example.com', password: 'password' } },
];

// Metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTime: 0,
  responseTimes: [],
  statusCodes: {},
  errors: {},
  startTime: Date.now(),
};

// Auth token (updated after login)
let authToken = null;

/**
 * Make HTTP request
 */
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, options.baseUrl);
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GlimmoraLoadTester/1.0',
      },
    };

    if (endpoint.requiresAuth && authToken) {
      reqOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const startTime = Date.now();

    const req = client.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;

        metrics.totalRequests++;
        metrics.totalTime += responseTime;
        metrics.responseTimes.push(responseTime);
        metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          metrics.successfulRequests++;
          
          // Update auth token from login response
          if (endpoint.method === 'POST' && endpoint.path.includes('login')) {
            try {
              const body = JSON.parse(data);
              authToken = body.access_token || body.token;
            } catch (e) {
              // Ignore parse errors
            }
          }
        } else if (res.statusCode >= 400) {
          metrics.failedRequests++;
          metrics.errors[res.statusCode] = (metrics.errors[res.statusCode] || 0) + 1;
        }

        if (options.verbose) {
          console.log(`[${new Date().toISOString()}] ${endpoint.method} ${endpoint.path} - ${res.statusCode} (${responseTime}ms)`);
        }

        resolve();
      });
    });

    req.on('error', (err) => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors[err.code] = (metrics.errors[err.code] || 0) + 1;

      if (options.verbose) {
        console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
      }

      resolve();
    });

    // Send body if present
    if (endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }

    req.end();
  });
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  GlimmoraTeam Load Testing');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\nConfiguration:`);
  console.log(`  Base URL:        ${options.baseUrl}`);
  console.log(`  Concurrent:      ${options.concurrent}`);
  console.log(`  Duration:        ${options.duration}s`);
  console.log(`  Ramp-up:         ${options.rampUp}s`);
  console.log(`\nEndpoints:`);
  TEST_ENDPOINTS.forEach((ep) => {
    console.log(`  ${ep.method} ${ep.path} (${ep.name})`);
  });
  console.log('\nStarting load test...\n');

  const endTime = Date.now() + options.duration * 1000;
  const rampUpEndTime = Date.now() + options.rampUp * 1000;
  let activeRequests = 0;

  while (Date.now() < endTime) {
    // Ramp-up phase
    if (Date.now() < rampUpEndTime) {
      const rampProgress = (Date.now() - metrics.startTime) / (options.rampUp * 1000);
      const currentConcurrency = Math.ceil(options.concurrent * rampProgress);
      
      while (activeRequests < currentConcurrency) {
        const endpoint = TEST_ENDPOINTS[Math.floor(Math.random() * TEST_ENDPOINTS.length)];
        makeRequest(endpoint).then(() => {
          activeRequests--;
        });
        activeRequests++;
      }
    } else {
      // Steady state phase
      while (activeRequests < options.concurrent) {
        const endpoint = TEST_ENDPOINTS[Math.floor(Math.random() * TEST_ENDPOINTS.length)];
        makeRequest(endpoint).then(() => {
          activeRequests--;
        });
        activeRequests++;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Wait for remaining requests to complete
  while (activeRequests > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Print results
  printResults();
}

/**
 * Print test results
 */
function printResults() {
  const elapsedTime = Date.now() - metrics.startTime;
  const throughput = (metrics.totalRequests / (elapsedTime / 1000)).toFixed(2);
  const avgResponseTime = (metrics.totalTime / metrics.totalRequests).toFixed(2);
  const minResponseTime = Math.min(...metrics.responseTimes);
  const maxResponseTime = Math.max(...metrics.responseTimes);
  
  const p95 = Math.round(metrics.responseTimes.length * 0.95);
  const p99 = Math.round(metrics.responseTimes.length * 0.99);
  const sorted = metrics.responseTimes.sort((a, b) => a - b);
  const p95ResponseTime = sorted[p95];
  const p99ResponseTime = sorted[p99];

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Load Test Results');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Total Duration:        ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`Total Requests:        ${metrics.totalRequests}`);
  console.log(`Successful:            ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed:                ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Throughput:            ${throughput} req/s`);

  console.log(`\nResponse Times:`);
  console.log(`  Min:                 ${minResponseTime}ms`);
  console.log(`  Max:                 ${maxResponseTime}ms`);
  console.log(`  Avg:                 ${avgResponseTime}ms`);
  console.log(`  P95:                 ${p95ResponseTime}ms`);
  console.log(`  P99:                 ${p99ResponseTime}ms`);

  console.log(`\nStatus Codes:`);
  Object.entries(metrics.statusCodes)
    .sort((a, b) => a[0] - b[0])
    .forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });

  if (Object.keys(metrics.errors).length > 0) {
    console.log(`\nErrors:`);
    Object.entries(metrics.errors).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// Run the test
runLoadTest().catch(console.error);
