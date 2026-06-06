"""Single-container launcher — runs all 9 FastAPI services + the gateway.

For the cheapest cloud deploy (one Render Free Web Service / one Railway service).
Each microservice runs as a uvicorn subprocess on 127.0.0.1:<local port>; the
gateway runs in THIS process bound to $PORT (the public port) and reverse-proxies
to them over loopback — which is exactly local_gateway.py's 127.0.0.1 fallback,
so no SERVICE_URL_* env vars are needed here.

If any service subprocess dies, we tear everything down so the platform restarts
the container (fail-fast, since one dead service = broken backend).
"""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))

# dir under services/ -> package -> loopback port (must match local_gateway.SERVICE_PORTS)
SERVICES = [
    ("auth-service", "auth_app", 8011),
    ("contributor-service", "contributor_app", 8012),
    ("enterprise-service", "enterprise_app", 8013),
    ("superadmin-service", "superadmin_app", 8014),
    ("mentor-service", "mentor_app", 8015),
    ("universities-service", "universities_app", 8016),
    ("women-service", "women_app", 8017),
    ("email-service", "email_app", 8018),
    ("file-service", "file_app", 8019),
]

PUBLIC_PORT = int(os.getenv("PORT", "9000"))  # platform-injected public port


def _pythonpath() -> str:
    """shared/ + every service dir, so `import <pkg>` resolves for all 9."""
    parts = [HERE, os.path.join(HERE, "shared")]
    parts += [os.path.join(HERE, "services", d) for d, _, _ in SERVICES]
    existing = os.environ.get("PYTHONPATH", "")
    if existing:
        parts.append(existing)
    return os.pathsep.join(parts)


def main() -> int:
    env = dict(os.environ)
    env["PYTHONPATH"] = _pythonpath()

    procs: list[subprocess.Popen] = []

    def shutdown(*_):
        for p in procs:
            if p.poll() is None:
                p.terminate()
        time.sleep(2)
        for p in procs:
            if p.poll() is None:
                p.kill()

    signal.signal(signal.SIGTERM, lambda *_: (shutdown(), sys.exit(0)))
    signal.signal(signal.SIGINT, lambda *_: (shutdown(), sys.exit(0)))

    # 1) Start the gateway FIRST on the public port, so the platform's port scan
    #    detects an open port within seconds (its /healthz works independently of
    #    the backing services). If we started 9 staggered services first, the port
    #    wouldn't open for ~27s and Render would log "No open ports detected".
    print(f"[run_all_in_one] starting gateway on 0.0.0.0:{PUBLIC_PORT}", flush=True)
    procs.append(
        subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "local_gateway:app",
             "--host", "0.0.0.0", "--port", str(PUBLIC_PORT)],
            env=env,
            cwd=HERE,
        )
    )

    # 2) Boot the 9 services on loopback. STAGGERED: all 9 run init_schema against
    #    the same Neon DB at startup; firing them simultaneously deadlocks on
    #    CREATE TABLE/ALTER locks. A short gap lets each finish schema work first.
    stagger = float(os.getenv("SERVICE_START_STAGGER", "3"))
    for _, pkg, port in SERVICES:
        print(f"[run_all_in_one] starting {pkg} on 127.0.0.1:{port}", flush=True)
        procs.append(
            subprocess.Popen(
                [sys.executable, "-m", "uvicorn", f"{pkg}.main:app",
                 "--host", "127.0.0.1", "--port", str(port)],
                env=env,
            )
        )
        time.sleep(stagger)

    # 3) Fail-fast: if ANY process exits, tear down so the platform restarts us.
    try:
        while True:
            for p in procs:
                code = p.poll()
                if code is not None:
                    print(f"[run_all_in_one] a process exited (code={code}); shutting down",
                          flush=True)
                    shutdown()
                    return code or 1
            time.sleep(2)
    except KeyboardInterrupt:
        shutdown()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
