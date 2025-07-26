#!/usr/bin/env python3
"""
Script to create the saathi database and tables
"""
import asyncio
import asyncpg
from app.core.config import settings

async def setup_database():
    try:
        print("🔧 Setting up database...")
        
        # Connect to the default postgres database
        conn = await asyncpg.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database="postgres",  # Connect to default database first
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
        )
        
        # Check if saathi database exists
        db_exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'saathi'"
        )
        
        if not db_exists:
            print("📦 Creating 'saathi' database...")
            await conn.execute('CREATE DATABASE saathi')
            print("✅ Database 'saathi' created successfully!")
        else:
            print("✅ Database 'saathi' already exists!")
        
        await conn.close()
        
        # Now connect to the saathi database to create tables
        print("🔗 Connecting to saathi database...")
        saathi_conn = await asyncpg.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database="saathi",
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
        )
        
        print("✅ Connected to saathi database!")
        await saathi_conn.close()
        
        print("🎉 Database setup completed successfully!")
        print("\n📝 Next steps:")
        print("1. Update your .env file to use POSTGRES_DB=saathi")
        print("2. Run your FastAPI server to create the tables")
        
    except Exception as e:
        print(f"❌ Database setup failed: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(setup_database())
