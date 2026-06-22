"""
Launcher for the mentor backend.

Use this instead of `uvicorn app:app` on Windows: it installs the Selector event
loop policy BEFORE uvicorn creates its loop, which avoids the Proactor-loop
ConnectionResetError that stalls responses when the remote Redis closes idle
TLS sockets. On Linux/Render this is a no-op and behaves exactly like uvicorn.

Run:  python run.py        (defaults to 127.0.0.1:8101)
"""

from __future__ import annotations

import asyncio
import os
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn  # noqa: E402  (must import after the policy is set)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8101"))
    uvicorn.run("app:app", host="127.0.0.1", port=port, loop="asyncio")
