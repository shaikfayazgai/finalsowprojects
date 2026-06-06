# Analytics & Workforce Intelligence Dashboards — Detailed Flow Document

**SOW Source:** Section 19.4, Section 3.1.6 (Analytics and Intelligence Console), Section 3.1.4, Section 27.3, Section 14.4, Section 9.5, Section 3.1.MVP.8
**Date:** 2026-03-06

---

## MODULE OVERVIEW

The Analytics & Workforce Intelligence Dashboards (Section 19.4) serve HR, Talent, PMO, and Finance stakeholders as a cross-cutting analytics surface.

**SOW-defined capabilities:**
- Skill heatmaps, utilization, and gap analysis (19.4)
- Economic performance dashboards — earnings, rates, margins (19.4)
- Governance and risk dashboards — incidents, fraud flags, overrides (19.4)
- Workforce intelligence dashboards — skills inventory, gaps, learning needs (3.1.6)
- Economic dashboards — spend, savings, ROI, earning distribution (3.1.6)
- Export and self-service analytics — filters, drilldowns (3.1.6)
- Dashboards for utilization, performance, diversity, geography, skill gaps (3.1.4)
- Service health dashboards, error alerting, basic tracing (3.1.MVP.8)

**SOW-defined KPIs to display (Section 27.3):**
- Operational: task completion rate, average time to assignment, SLA compliance rate
- Workforce: contributor engagement levels, skill development progress, diversity/inclusion participation metrics
- Economic: average cost per task, platform transaction volume, contributor earnings growth
- Quality: acceptance rate of submitted work, rework percentages, customer satisfaction scores

**Risk monitoring (Section 14.4):** SLA breaches, fraud alerts, economic anomalies, governance violations

---

## A. WORKFORCE INTELLIGENCE DASHBOARDS

### Flow A1: Skills Inventory Dashboard
**SOW Reference:** 3.1.6 (skills inventory), 19.4 (skill heatmaps)
**Entry Point:** Analytics navigation > Workforce Intelligence > Skills Inventory
**Pre-conditions:** User has analytics access role (RBAC)

**Step-by-step:**
1. User navigates to Skills Inventory dashboard
2. System displays:
   - Total contributor count by skill category
   - Top skills across contributor base (bar chart / table)
   - Skills distribution by proficiency level (beginner/intermediate/advanced)
   - Recently added skills (new contributors or skill updates)
3. Filters available:
   - Contributor segment (student, women workforce, freelancer, internal employee)
   - Geography / timezone
   - Proficiency level
   - Date range
4. User can drill down on any skill to see:
   - Number of contributors with that skill
   - Proficiency distribution
   - Task demand for that skill (tasks requiring it)
   - Supply-demand ratio
5. Export: CSV, PDF

**Data displayed:** Skill name, contributor count per skill, proficiency breakdown, segment breakdown, trend over time
**Actions:** Filter, drill down, export
**Edge cases:** No contributors with certain skills (show "0 contributors" with flag); new platform with sparse data (show onboarding progress)

---

### Flow A2: Skill Heatmap View
**SOW Reference:** 19.4 (skill heatmaps)
**Entry Point:** Skills Inventory > "View Heatmap" or Workforce Intelligence > Skill Heatmap

**Step-by-step:**
1. System displays heatmap visualization:
   - Rows: skill categories
   - Columns: proficiency levels or geography
   - Color intensity: contributor density (more contributors = darker)
2. User can toggle heatmap dimension:
   - Skills x Proficiency
   - Skills x Geography
   - Skills x Contributor Segment
3. Hover on cell shows: exact count, percentage of total
4. Click on cell drills into filtered skills inventory for that combination
5. Export: PNG image of heatmap, underlying data as CSV

**Data displayed:** Skill categories, contributor counts per cell, color-coded density
**Actions:** Toggle dimensions, hover for details, click to drill down, export
**Edge cases:** Very sparse data produces mostly empty heatmap — show message suggesting data is growing

---

### Flow A3: Skill Gap Analysis
**SOW Reference:** 19.4 (gap analysis), 3.1.6 (gaps), 3.1.4 (skill gaps)
**Entry Point:** Workforce Intelligence > Gap Analysis

**Step-by-step:**
1. System calculates gap between:
   - Skill DEMAND: skills required by active/upcoming tasks across all projects
   - Skill SUPPLY: skills available in contributor base (from digital twins)
2. Displays:
   - Skills with highest demand-supply gap (table, sorted by gap severity)
   - Gap trend over time (is the gap growing or shrinking?)
   - Skills with surplus supply (more contributors than tasks)
3. For each gap:
   - Skill name
   - Tasks requiring this skill (count)
   - Contributors with this skill (count)
   - Gap ratio (demand / supply)
   - Severity indicator (critical / moderate / low)
4. User can filter by:
   - Project / SOW
   - Skill category
   - Geography
   - Time period
5. Drill down on a skill gap shows:
   - Specific tasks requiring this skill
   - Contributors who have adjacent skills (could upskill)
   - Learning recommendations (Section 19.2 — learning recommendations)
6. Export: CSV, PDF report

**Data displayed:** Skill name, demand count, supply count, gap ratio, severity, trend
**Actions:** Filter, sort, drill down, export
**Edge cases:** No active tasks (show "No demand data available"); all gaps filled (show positive state)

---

### Flow A4: Utilization Dashboard
**SOW Reference:** 19.4 (utilization), 3.1.4 (utilization dashboards)
**Entry Point:** Workforce Intelligence > Utilization

**Step-by-step:**
1. System displays:
   - Overall utilization rate (assigned contributors / total active contributors)
   - Utilization by contributor segment (students, women workforce, freelancers, internal)
   - Utilization trend over time (line chart)
   - Top utilized contributors (anonymized or by segment)
   - Under-utilized segments (contributors available but not assigned)
2. Filters:
   - Contributor segment
   - Skill category
   - Geography
   - Date range
3. Drill down on segment shows:
   - Individual utilization distribution (histogram)
   - Average hours assigned vs available
   - Task completion rates within segment
4. Export: CSV, PDF

**Data displayed:** Utilization %, segment breakdown, trend line, availability vs assignment
**Actions:** Filter, drill down, export
**Edge cases:** New contributors not yet assigned show as 0% utilization; internal employees with partial availability

---

### Flow A5: Learning Needs Dashboard
**SOW Reference:** 3.1.6 (learning needs)
**Entry Point:** Workforce Intelligence > Learning Needs

**Step-by-step:**
1. System displays:
   - Skills most needed based on gap analysis
   - Contributors who could benefit from upskilling (have adjacent skills)
   - Learning velocity metrics across contributor base (Section 11.2 — learning velocity)
   - Skill progression trends
2. Filters:
   - Contributor segment
   - Skill category
   - Gap severity
3. For each learning need:
   - Skill name
   - Current contributor count at each proficiency level
   - Number who could upskill from adjacent skill
   - Recommended approach (more tasks at this skill level, mentoring, etc.)
4. Export: CSV, PDF

**Data displayed:** Skill name, current proficiency distribution, adjacent skill holders, recommended actions
**Actions:** Filter, sort, export

---

### Flow A6: Diversity & Geography Dashboard
**SOW Reference:** 3.1.4 (diversity, geography)
**Entry Point:** Workforce Intelligence > Diversity & Geography

**Step-by-step:**
1. System displays:
   - Contributor distribution by segment (students, women workforce, freelancers, internal)
   - Geographic distribution (map view or table by region/country)
   - Diversity participation metrics (Section 27.3 — diversity/inclusion participation)
   - Segment growth trends over time
2. Filters:
   - Contributor segment
   - Geography
   - Date range
   - Active vs all contributors
3. Drill down by geography shows:
   - Contributor count
   - Skills available in that region
   - Task assignment rates
   - Payout distribution
4. Export: CSV, PDF

**Data displayed:** Segment counts, geographic distribution, participation rates, growth trends
**Actions:** Filter, drill down, map interaction, export
**Edge cases:** Regions with very few contributors (privacy consideration — aggregate rather than show individuals)

---

### Flow A7: Contributor Engagement Dashboard
**SOW Reference:** 27.3 (contributor engagement levels)
**Entry Point:** Workforce Intelligence > Engagement

**Step-by-step:**
1. System displays:
   - Active contributors (assigned to at least one task in period)
   - Engagement rate (active / total registered)
   - Engagement by segment
   - Engagement trend over time
   - Contributors at risk of disengagement (no activity in X days)
2. Filters:
   - Contributor segment
   - Geography
   - Date range
3. Drill down shows:
   - Activity distribution (tasks completed per contributor)
   - Time since last activity
   - Onboarding completion rates
4. Export: CSV, PDF

**Data displayed:** Active count, engagement %, segment breakdown, trend, at-risk count
**Actions:** Filter, drill down, export

---

## B. ECONOMIC PERFORMANCE DASHBOARDS

### Flow B1: Economic Overview Dashboard
**SOW Reference:** 19.4 (economic performance), 3.1.6 (economic dashboards)
**Entry Point:** Analytics > Economic Performance > Overview

**Step-by-step:**
1. System displays summary cards:
   - Total spend (across all projects in period)
   - Average cost per task (Section 27.3)
   - Platform transaction volume (Section 27.3)
   - Contributor earnings growth (Section 27.3)
2. Charts:
   - Spend trend over time
   - Cost per task trend
   - Transaction volume trend
3. Breakdown tables:
   - Spend by project
   - Spend by skill category
   - Spend by geography
4. Filters: date range, project, skill category, geography
5. Export: CSV, PDF

**Data displayed:** Total spend, avg cost/task, transaction volume, earnings growth, trends, breakdowns
**Actions:** Filter, drill down, export

---

### Flow B2: Spend Dashboard
**SOW Reference:** 3.1.6 (spend)
**Entry Point:** Economic Performance > Spend Analysis

**Step-by-step:**
1. System displays:
   - Total spend in period
   - Spend by project (table with project name, total spend, task count, avg cost/task)
   - Spend by skill category (which skills cost most?)
   - Spend by geography (where is money going?)
   - Spend by contributor segment
2. Drill down on project shows:
   - Per-task pricing breakdown
   - Rate card applied
   - Actual vs estimated cost
3. Filters: date range, project, skill, geography, segment
4. Export: CSV, PDF

**Data displayed:** Spend totals, per-project breakdowns, per-skill breakdowns, rate card details
**Actions:** Filter, drill down, sort, export

---

### Flow B3: Savings / ROI Dashboard
**SOW Reference:** 3.1.6 (savings, ROI)
**Entry Point:** Economic Performance > Savings & ROI

**Step-by-step:**
1. System displays:
   - Estimated savings vs traditional staffing (if baseline data available)
   - ROI metrics (value delivered per dollar spent)
   - Cost efficiency trends over time
   - Comparison: rate card pricing vs market rates (if data available)
2. Filters: date range, project type, geography
3. Export: CSV, PDF

**Data displayed:** Savings estimates, ROI calculations, efficiency trends
**Actions:** Filter, export
**Edge cases:** Insufficient data for savings calculation — show "Needs baseline configuration"

---

### Flow B4: Earning Distribution Dashboard
**SOW Reference:** 3.1.6 (earning distribution)
**Entry Point:** Economic Performance > Earnings Distribution

**Step-by-step:**
1. System displays:
   - Total contributor earnings in period
   - Earnings distribution by contributor segment (students, women workforce, etc.)
   - Earnings distribution by geography
   - Earnings distribution by skill category
   - Top earning skill categories
   - Revenue distribution: contributors vs mentors/reviewers vs platform fees (Section 9.5)
2. Drill down by segment shows:
   - Earnings histogram (distribution of individual earnings)
   - Median and mean earnings
   - Earnings growth trend
3. Filters: date range, segment, geography, skill
4. Export: CSV, PDF

**Data displayed:** Total earnings, segment/geography/skill breakdowns, distribution histograms
**Actions:** Filter, drill down, export

---

### Flow B5: Task-Level Pricing Transparency
**SOW Reference:** 9.5 (task-level pricing, payment allocations, commission calculations)
**Entry Point:** Economic Performance > Pricing Transparency

**Step-by-step:**
1. System displays:
   - Task pricing breakdown table:
     - Task ID / name
     - Rate card applied (role/skill/level/region)
     - Effort estimate
     - Calculated price (rate card x effort)
     - Actual payout amount
     - Platform fee / commission
   - Payment allocation summary:
     - Contributor payments total
     - Mentor/reviewer payments total
     - Platform operational fees total
   - Commission calculation transparency
2. Filters: project, task, date range, skill
3. Drill down on task shows full pricing calculation
4. Export: CSV, PDF

**Data displayed:** Per-task pricing, rate cards used, effort estimates, commissions, allocations
**Actions:** Filter, drill down, export

---

### Flow B6: Platform Transaction Volume
**SOW Reference:** 27.3 (platform transaction volume)
**Entry Point:** Economic Performance > Transaction Volume

**Step-by-step:**
1. System displays:
   - Total transactions in period (task assignments, submissions, acceptances, payouts)
   - Transaction volume by type (bar chart)
   - Transaction volume trend (line chart over time)
   - Peak transaction periods
2. Filters: date range, transaction type
3. Export: CSV

**Data displayed:** Transaction counts by type, trends, peaks
**Actions:** Filter, export

---

### Flow B7: Average Cost Per Task
**SOW Reference:** 27.3 (average cost per task)
**Entry Point:** Economic Performance > Cost Analysis

**Step-by-step:**
1. System displays:
   - Overall average cost per task
   - Average cost by: skill category, difficulty level, geography, work type
   - Cost trend over time
   - Cost comparison across projects
2. Filters: date range, skill, geography, project, work type
3. Drill down shows per-task detail
4. Export: CSV, PDF

**Data displayed:** Avg cost overall, segmented averages, trends
**Actions:** Filter, drill down, export

---

### Flow B8: Contributor Earnings Growth
**SOW Reference:** 27.3 (contributor earnings growth)
**Entry Point:** Economic Performance > Earnings Growth

**Step-by-step:**
1. System displays:
   - Contributor earnings growth rate (period over period)
   - Earnings growth by segment
   - New contributor earnings (first-month earnings average)
   - Returning contributor earnings trend
2. Filters: date range, segment, geography
3. Export: CSV, PDF

**Data displayed:** Growth rates, segment breakdowns, new vs returning earnings
**Actions:** Filter, export

---

## C. OPERATIONAL PERFORMANCE DASHBOARDS

### Flow C1: Task Completion Rate Dashboard
**SOW Reference:** 27.3 (task completion rate)
**Entry Point:** Analytics > Operational > Task Completion

**Step-by-step:**
1. System displays:
   - Overall task completion rate (completed / total assigned, in period)
   - Completion rate by: project, skill category, contributor segment, difficulty
   - Completion rate trend over time
   - Incomplete tasks breakdown (abandoned, in-progress past SLA, reassigned)
2. Filters: date range, project, skill, segment
3. Drill down on incomplete tasks shows:
   - Task detail
   - Assigned contributor
   - Time overdue
   - Escalation status
4. Export: CSV, PDF

**Data displayed:** Completion rates, segmented breakdowns, trends, incomplete task details
**Actions:** Filter, drill down, export

---

### Flow C2: Average Time to Assignment Dashboard
**SOW Reference:** 27.3 (average time to assignment)
**Entry Point:** Operational > Time to Assignment

**Step-by-step:**
1. System displays:
   - Average time from task creation to contributor assignment
   - Time to assignment by: skill category, difficulty, geography
   - Trend over time
   - Tasks currently unassigned (count, oldest)
2. Filters: date range, skill, project, geography
3. Export: CSV, PDF

**Data displayed:** Avg assignment time, segmented breakdowns, unassigned backlog
**Actions:** Filter, sort, export

---

### Flow C3: SLA Compliance Dashboard
**SOW Reference:** 27.3 (SLA compliance rate), 14.4 (SLA breaches)
**Entry Point:** Operational > SLA Compliance

**Step-by-step:**
1. System displays:
   - Overall SLA compliance rate (tasks completed within SLA / total)
   - SLA compliance by: work type, project, contributor segment
   - SLA breach count and trend
   - Active SLA breaches (tasks currently past SLA)
   - Breach severity distribution
2. Filters: date range, project, work type, severity
3. Drill down on breaches shows:
   - Task detail
   - SLA target vs actual
   - Contributor assigned
   - Escalation status
4. Export: CSV, PDF

**Data displayed:** Compliance %, breach counts, active breaches, severity distribution
**Actions:** Filter, drill down, export

---

### Flow C4: Throughput Dashboard
**SOW Reference:** 3.1.6 (real-time and historical views on throughput)
**Entry Point:** Operational > Throughput

**Step-by-step:**
1. System displays:
   - Tasks completed per period (day/week/month)
   - Throughput by: project, skill category, contributor segment
   - Real-time view: tasks in progress right now
   - Historical comparison (this period vs last period)
2. Filters: date range, project, skill, segment
3. Export: CSV, PDF

**Data displayed:** Tasks/period, segmented throughput, real-time counts, period comparison
**Actions:** Filter, toggle real-time vs historical, export

---

### Flow C5: Quality Dashboard
**SOW Reference:** 27.3 (acceptance rate, rework percentages), 3.1.6 (quality)
**Entry Point:** Operational > Quality

**Step-by-step:**
1. System displays:
   - First-attempt acceptance rate (accepted on first submission / total)
   - Overall acceptance rate
   - Rework percentage (tasks requiring at least one rework cycle)
   - Average rework cycles per task
   - Quality by: project, skill, contributor segment, reviewer
2. Filters: date range, project, skill, segment
3. Drill down shows:
   - Tasks with most rework cycles
   - Common rework reasons (from reviewer feedback)
   - Quality trends over time
4. Export: CSV, PDF

**Data displayed:** Acceptance rates, rework %, rework cycle counts, quality trends
**Actions:** Filter, drill down, export

---

### Flow C6: Customer Satisfaction Dashboard
**SOW Reference:** 27.3 (customer satisfaction scores)
**Entry Point:** Operational > Satisfaction

**Step-by-step:**
1. System displays:
   - Overall customer satisfaction score
   - Satisfaction by: project, work type
   - Satisfaction trend over time
   - Comments/feedback summary (if collected)
2. Filters: date range, project, work type
3. Export: CSV, PDF

**Data displayed:** Satisfaction scores, segmented views, trends
**Actions:** Filter, export
**Edge cases:** No satisfaction data collected yet — show "Configure satisfaction surveys"

---

### Flow C7: Bottleneck Analysis
**SOW Reference:** 3.1.6 (bottlenecks)
**Entry Point:** Operational > Bottlenecks

**Step-by-step:**
1. System identifies bottlenecks:
   - Workflow stages with longest wait times (SOW review, decomposition, assignment, execution, review, acceptance)
   - Skills with highest unassigned task backlog
   - Reviewers with longest review queues
   - Projects with most exceptions/escalations
2. Display:
   - Bottleneck summary table (stage, avg wait time, items queued)
   - Visual workflow funnel showing drop-off/wait at each stage
3. Filters: date range, project, workflow stage
4. Drill down on bottleneck shows specific items causing delay
5. Export: CSV, PDF

**Data displayed:** Wait times per stage, queue depths, bottleneck causes
**Actions:** Filter, drill down, export

---

## D. GOVERNANCE & RISK DASHBOARDS

### Flow D1: Governance Overview Dashboard
**SOW Reference:** 19.4 (governance and risk dashboards)
**Entry Point:** Analytics > Governance & Risk > Overview

**Step-by-step:**
1. System displays summary:
   - Total governance events in period
   - Active incidents count
   - Fraud alerts count
   - SLA breaches count
   - Override events count
   - Risk score trend (overall platform risk)
2. Quick links to detailed views for each category
3. Filters: date range, severity, category
4. Export: CSV, PDF

**Data displayed:** Event counts, active incidents, risk trend
**Actions:** Filter, navigate to detailed views, export

---

### Flow D2: SLA Breach Monitoring
**SOW Reference:** 14.4 (SLA breaches)
**Entry Point:** Governance & Risk > SLA Breaches

**Step-by-step:**
1. System displays:
   - Active SLA breaches (table):
     - Task/project reference
     - SLA type (assignment, execution, review, acceptance)
     - Target vs actual time
     - Severity (critical / major / minor)
     - Assigned contributor/reviewer
     - Escalation status
   - SLA breach trend over time
   - Breach count by SLA type
2. Actions per breach:
   - View task detail
   - Trigger escalation
   - Reassign
3. Filters: severity, SLA type, project, date range
4. Export: CSV, PDF

**Data displayed:** Breach details, severity, escalation status, trends
**Actions:** View detail, escalate, reassign, filter, export

---

### Flow D3: Fraud Alert Dashboard
**SOW Reference:** 14.4 (fraud alerts), 14.2 (fraud detection)
**Entry Point:** Governance & Risk > Fraud Alerts

**Step-by-step:**
1. System displays:
   - Active fraud alerts (table):
     - Alert type (plagiarism, identity, behavioral anomaly)
     - Severity
     - Contributor reference (anonymized per privacy)
     - Task/project reference
     - Detection method
     - Status (new, investigating, resolved, dismissed)
   - Fraud alert trend over time
   - Alerts by type (breakdown)
2. Actions per alert:
   - View details
   - Mark as investigating
   - Resolve (with outcome)
   - Dismiss (with reason)
3. Filters: alert type, severity, status, date range
4. Export: CSV, PDF

**Data displayed:** Alert details, types, severities, resolution status
**Actions:** View, investigate, resolve, dismiss, filter, export

---

### Flow D4: Economic Anomaly Dashboard
**SOW Reference:** 14.4 (economic anomalies)
**Entry Point:** Governance & Risk > Economic Anomalies

**Step-by-step:**
1. System displays:
   - Detected anomalies:
     - Unusual pricing patterns
     - Unexpected payout volumes
     - Cost spikes on specific skills/projects
     - Invoice discrepancies
   - Anomaly severity and status
   - Trend over time
2. Actions per anomaly:
   - View details (what triggered the flag)
   - Investigate
   - Resolve / Dismiss
3. Filters: anomaly type, severity, date range
4. Export: CSV, PDF

**Data displayed:** Anomaly descriptions, financial impact, severity, trends
**Actions:** View, investigate, resolve, filter, export

---

### Flow D5: Governance Violations Dashboard
**SOW Reference:** 14.4 (governance violations)
**Entry Point:** Governance & Risk > Violations

**Step-by-step:**
1. System displays:
   - Policy violations (code of conduct, anti-harassment, data protection)
   - Violation count by category
   - Resolution status (open, investigating, resolved)
   - Trend over time
2. Actions per violation:
   - View details
   - Investigate
   - Resolve with decision
3. Filters: violation type, status, severity, date range
4. Export: CSV, PDF

**Data displayed:** Violation details, categories, resolution status
**Actions:** View, investigate, resolve, filter, export

---

### Flow D6: Incident & Override Log
**SOW Reference:** 19.4 (overrides), 3.1.MVP.8 (immutable audit logging)
**Entry Point:** Governance & Risk > Incident & Override Log

**Step-by-step:**
1. System displays:
   - Chronological log of governance events:
     - Escalations triggered
     - Admin overrides (assignment overrides, policy overrides)
     - Sanctions applied
     - System incidents
   - Each entry shows: timestamp, event type, actor, affected entities, reason
2. Filters: event type, date range, actor, project
3. Click on entry shows full detail with audit trail
4. Export: CSV, PDF

**Data displayed:** Event log with timestamps, types, actors, reasons
**Actions:** Filter, view detail, export

---

### Flow D7: Agent Activity Dashboard
**SOW Reference:** 3.1.1 (governance dashboards for monitoring agent activity, overrides, exceptions)
**Entry Point:** Governance & Risk > AI Agent Activity

**Step-by-step:**
1. System displays (for each AI agent active in MVP):
   - SOW Intake Assistant: invocations, recommendations made, human overrides
   - Decomposition Assistant: plans generated, human edits to plans
   - Contributor Support Assistant: queries handled, escalations to human
   - Review Assistant: rubric suggestions made, mentor agreement rate
2. Metrics:
   - Agent invocation count
   - Recommendation acceptance rate (how often humans accepted AI suggestions)
   - Override rate (how often humans changed AI output)
   - Error/fallback rate
3. Filters: agent type, date range
4. Export: CSV, PDF

**Data displayed:** Per-agent invocation counts, acceptance rates, override rates
**Actions:** Filter, drill down per agent, export
**Edge cases:** Agent not yet active — show "Not deployed" status

---

## E. SELF-SERVICE ANALYTICS

### Flow E1: Filter & Drilldown
**SOW Reference:** 3.1.6 (self-service analytics, filters, drilldowns)
**Entry Point:** Any dashboard view > Apply Filters

**Step-by-step:**
1. User opens filter panel on any dashboard
2. Available filters (context-dependent):
   - Date range (preset: last 7 days, 30 days, 90 days, custom)
   - Project / SOW
   - Contributor segment (student, women workforce, freelancer, internal)
   - Skill category
   - Geography / region
   - Work type variant
   - Severity / priority
3. User selects filter values
4. Dashboard refreshes with filtered data
5. Active filters shown as chips/tags (removable)
6. User can click on any data point to drill down to next level of detail

**Actions:** Select filters, clear filters, drill down on data points
**Edge cases:** Filter combination produces no results — show "No data matching filters" with suggestion to broaden

---

### Flow E2: Date Range Selection
**SOW Reference:** 3.1.6 (self-service analytics)
**Entry Point:** Any dashboard > Date Range picker

**Step-by-step:**
1. User clicks date range selector
2. Options:
   - Presets: Last 7 days, Last 30 days, Last 90 days, Year to date, All time
   - Custom: Calendar picker for start date and end date
3. User selects range
4. All dashboard widgets refresh for selected period
5. Comparison toggle: "Compare to previous period" (shows delta indicators)

**Actions:** Select preset, custom range, toggle comparison
**Edge cases:** Date range with no data — show "No data in selected period"

---

### Flow E3: Custom Report Builder
**SOW Reference:** 3.1.6 (export and self-service analytics)
**Entry Point:** Analytics > Reports > Build Custom Report

**Step-by-step:**
1. User selects report type:
   - Workforce Intelligence
   - Economic Performance
   - Operational Performance
   - Governance & Risk
2. User selects metrics to include (checkboxes from available KPIs)
3. User configures:
   - Date range
   - Filters (segment, geography, project, etc.)
   - Grouping / breakdown dimensions
   - Sort order
4. Preview: system renders report preview
5. User reviews and adjusts
6. Save: user can save report configuration for reuse
7. Export: CSV, PDF

**Data displayed:** Selected metrics with applied filters and groupings
**Actions:** Select metrics, configure filters, preview, save, export
**Edge cases:** Too many metrics selected — show warning about report complexity

---

### Flow E4: Export
**SOW Reference:** 3.1.6 (export), 3.1.4 (export and reporting capabilities)
**Entry Point:** Any dashboard or report > Export button

**Step-by-step:**
1. User clicks Export on any dashboard or report view
2. Export options:
   - CSV (raw data table)
   - PDF (formatted report with charts)
   - API (for programmatic access — provides endpoint reference)
3. User selects format
4. System generates export with current filters applied
5. File downloads or API endpoint is displayed

**Actions:** Select format, download
**Edge cases:** Large dataset export — show progress indicator; very large exports may be queued

---

### Flow E5: Saved Views / Bookmarks
**SOW Reference:** 3.1.6 (self-service analytics)
**Entry Point:** Any dashboard > Save View

**Step-by-step:**
1. User configures a dashboard with specific filters and settings
2. User clicks "Save View"
3. User names the saved view
4. View appears in user's saved views list
5. User can load saved view to restore all filters/settings
6. User can delete or rename saved views

**Actions:** Save, name, load, delete, rename
**Edge cases:** Maximum saved views limit — show message

---

## F. SYSTEM HEALTH (MVP)

### Flow F1: Service Health Dashboard
**SOW Reference:** 3.1.MVP.8 (service health dashboards)
**Entry Point:** Analytics > System Health > Service Status

**Step-by-step:**
1. System displays:
   - Service status grid (each MVP microservice):
     - Service name
     - Status: healthy / degraded / down
     - Uptime % (current period)
     - Last incident
   - Overall platform health score
   - Uptime trend over time
2. Click on service shows:
   - Detailed uptime history
   - Recent error counts
   - Response time metrics
3. Filters: service, date range, status
4. Export: CSV

**Data displayed:** Service names, status indicators, uptime %, response times
**Actions:** View detail, filter, export
**Edge cases:** Service reporting delayed — show "Status unknown" with timestamp of last check

---

### Flow F2: Error Alerting
**SOW Reference:** 3.1.MVP.8 (error alerting)
**Entry Point:** System Health > Error Alerts

**Step-by-step:**
1. System displays:
   - Active error alerts (table):
     - Timestamp
     - Service affected
     - Error type / code
     - Severity (critical / warning / info)
     - Status (active / acknowledged / resolved)
   - Error rate trend over time
   - Top error types (frequency)
2. Actions per alert:
   - Acknowledge
   - View details (stack trace, context)
   - Mark resolved
3. Filters: severity, service, status, date range
4. Export: CSV

**Data displayed:** Alert details, error rates, frequency analysis
**Actions:** Acknowledge, view detail, resolve, filter, export

---

### Flow F3: Basic Tracing
**SOW Reference:** 3.1.MVP.8 (basic tracing)
**Entry Point:** System Health > Traces

**Step-by-step:**
1. System displays:
   - Recent request traces (table):
     - Trace ID
     - Timestamp
     - User action (SOW upload, task submit, review, etc.)
     - Services involved
     - Total duration
     - Status (success / error)
   - Slow request analysis (requests above threshold)
2. Click on trace shows:
   - Waterfall diagram of service calls
   - Duration per service
   - Error details (if any)
3. Filters: user action type, status, duration threshold, date range
4. Export: CSV

**Data displayed:** Trace details, service call waterfall, durations
**Actions:** View trace detail, filter, export

---

## NAVIGATION MAP

```
Analytics & Workforce Intelligence Dashboards
|
|-- Workforce Intelligence
|   |-- Skills Inventory [A1]
|   |-- Skill Heatmap [A2]
|   |-- Gap Analysis [A3]
|   |-- Utilization [A4]
|   |-- Learning Needs [A5]
|   |-- Diversity & Geography [A6]
|   |-- Engagement [A7]
|
|-- Economic Performance
|   |-- Overview [B1]
|   |-- Spend Analysis [B2]
|   |-- Savings & ROI [B3]
|   |-- Earnings Distribution [B4]
|   |-- Pricing Transparency [B5]
|   |-- Transaction Volume [B6]
|   |-- Cost Per Task [B7]
|   |-- Earnings Growth [B8]
|
|-- Operational
|   |-- Task Completion [C1]
|   |-- Time to Assignment [C2]
|   |-- SLA Compliance [C3]
|   |-- Throughput [C4]
|   |-- Quality [C5]
|   |-- Satisfaction [C6]
|   |-- Bottlenecks [C7]
|
|-- Governance & Risk
|   |-- Overview [D1]
|   |-- SLA Breaches [D2]
|   |-- Fraud Alerts [D3]
|   |-- Economic Anomalies [D4]
|   |-- Governance Violations [D5]
|   |-- Incident & Override Log [D6]
|   |-- AI Agent Activity [D7]
|
|-- Self-Service
|   |-- Filter & Drilldown [E1] (available on all views)
|   |-- Date Range [E2] (available on all views)
|   |-- Custom Report Builder [E3]
|   |-- Export [E4] (available on all views)
|   |-- Saved Views [E5]
|
|-- System Health
|   |-- Service Status [F1]
|   |-- Error Alerts [F2]
|   |-- Traces [F3]
```

---

## SOW CROSS-REFERENCE INDEX

| Flow | Primary SOW Section | Supporting Sections |
|------|-------------------|-------------------|
| A1-A2 | 19.4, 3.1.6 | 3.1.4 |
| A3 | 19.4, 3.1.6 | 3.1.4 |
| A4 | 19.4, 3.1.4 | — |
| A5 | 3.1.6 | 11.2 |
| A6 | 3.1.4 | 27.3 |
| A7 | 27.3 | — |
| B1-B8 | 19.4, 3.1.6 | 27.3, 9.5 |
| C1-C7 | 27.3, 3.1.6 | 14.4 |
| D1-D7 | 19.4, 14.4 | 3.1.1, 3.1.MVP.8 |
| E1-E5 | 3.1.6, 3.1.4 | — |
| F1-F3 | 3.1.MVP.8 | — |
