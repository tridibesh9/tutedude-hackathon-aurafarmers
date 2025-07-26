#!/usr/bin/env python3
"""
Simple script to test PostgreSQL connection
"""
import asyncio
import asyncpg
from app.core.config import settings

async def test_connection():
    try:
        print(f"Testing connection to: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}")
        print(f"Database: {settings.POSTGRES_DB}")
        print(f"Username: {settings.POSTGRES_USER}")
        print("Password: [HIDDEN]")
        print("-" * 50)
        
        # Try to connect
        conn = await asyncpg.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            timeout=10  # 10 second timeout
        )
        
        # Test a simple query
        version = await conn.fetchval('SELECT version()')
        print(f"✅ Connection successful!")
        print(f"PostgreSQL version: {version}")
        
        await conn.close()
        
    except asyncpg.exceptions.InvalidPasswordError:
        print("❌ Authentication failed - Invalid username or password")
    except asyncpg.exceptions.InvalidCatalogNameError:
        print("❌ Database does not exist")
    except asyncpg.exceptions.ConnectionDoesNotExistError:
        print("❌ Connection failed - Host unreachable")
    except asyncio.TimeoutError:
        print("❌ Connection timeout - Check security groups/firewall")
    except Exception as e:
        print(f"❌ Connection failed: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
