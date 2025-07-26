import asyncio
import asyncpg
from app.core.config import settings
from app.db.database import engine, Base

async def reset_database():
    """Drop all tables and recreate them with the new schema"""
    
    print("🔄 Resetting database with new schema...")
    
    # Connect directly to PostgreSQL to drop all tables
    conn = await asyncpg.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        database=settings.POSTGRES_DB
    )
    
    try:
        # Drop all tables (in reverse order due to foreign key constraints)
        tables_to_drop = [
            "ratings", "order_items", "orders", "inventories", 
            "products", "sellers", "buyers", "base_users"
        ]
        
        for table in tables_to_drop:
            try:
                await conn.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
                print(f"✅ Dropped table: {table}")
            except Exception as e:
                print(f"⚠️  Error dropping {table}: {e}")
        
        print("🗑️  All existing tables dropped")
        
    finally:
        await conn.close()
    
    # Recreate all tables using SQLAlchemy
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database schema recreated successfully!")
    print("🎉 Your database is now ready with the new schema")

if __name__ == "__main__":
    asyncio.run(reset_database())