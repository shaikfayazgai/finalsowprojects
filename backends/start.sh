#!/usr/bin/env bash
# Production launcher (Railway / any single-container host).
# Boots the 5 role backends on internal ports, then runs the gateway on the
# public $PORT — the gateway reverse-proxies each /api path to the right backend
# (falls back to 127.0.0.1:<port> when SERVICE_URL_<ROLE> isn't set). All env
# vars come from the host (Railway Variables), so no .env file is needed here.

start_role () {
  ( cd "$1/backend" && PYTHONPATH=. python -m uvicorn app:app --host 127.0.0.1 --port "$2" ) &
}

start_role mentor      8101
start_role super-admin 8102
start_role enterprise  8103
start_role freelancer  8104
start_role reviewer    8105

# Gateway on the public port Railway assigns (defaults to 9000 locally).
exec python -m uvicorn gateway:app --host 0.0.0.0 --port "${PORT:-9000}"
