from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


async def create_mongo_client(
    url: str,
    db_name: str,
    server_selection_timeout_ms: int = 10000,
    connect_timeout_ms: int = 10000,
) -> tuple[AsyncIOMotorClient, AsyncIOMotorDatabase]:
    client = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=server_selection_timeout_ms,
        connectTimeoutMS=connect_timeout_ms,
    )
    db = client[db_name]
    return client, db


def close_mongo_client(client: AsyncIOMotorClient) -> None:
    client.close()
