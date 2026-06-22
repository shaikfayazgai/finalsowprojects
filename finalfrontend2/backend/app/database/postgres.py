import re
import ssl
import asyncpg


async def create_pg_pool(url: str) -> asyncpg.Pool:
    """
    Create an asyncpg connection pool.
    Strips sslmode from the DSN and passes an ssl context explicitly so
    asyncpg works correctly with Neon / Supabase cloud Postgres.
    """
    if "sslmode=require" in url or "sslmode=verify-full" in url:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        # Remove sslmode query param — asyncpg takes ssl= kwarg instead
        clean_url = re.sub(r"[?&]sslmode=[^&]*", "", url).rstrip("?&")
        return await asyncpg.create_pool(
            dsn=clean_url,
            ssl=ssl_ctx,
            min_size=1,
            max_size=10,
            command_timeout=30,
        )

    return await asyncpg.create_pool(
        dsn=url,
        min_size=1,
        max_size=10,
        command_timeout=30,
    )


async def close_pg_pool(pool: asyncpg.Pool) -> None:
    await pool.close()
