#!/usr/bin/env python3
"""
Complete Demo Script for E-commerce Bargaining System
====================================================

This script demonstrates the complete flow of the bargaining system:
1. User registration (buyer and seller)
2. Product creation with inventory
3. Bargain room creation
4. Real-time bargaining with WebSocket

Usage:
    python complete_demo.py

Make sure the backend server is running on localhost:8000
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

class EcommerceDemo:
    def __init__(self):
        self.session = None
        self.buyer_token = None
        self.seller_token = None
        self.buyer_id = None
        self.seller_id = None
        self.product_id = None
        self.room_id = None
        
    async def create_session(self):
        """Create HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request"""
        url = f"{BASE_URL}{endpoint}"
        
        async with self.session.request(
            method, 
            url, 
            json=data, 
            headers=headers or {}
        ) as response:
            response_data = await response.json()
            if response.status >= 400:
                print(f"❌ Error {response.status}: {response_data}")
                return None
            return response_data
            
    async def register_users(self):
        """Register buyer and seller accounts"""
        print("🔐 Registering test users...")
        
        # Register buyer
        buyer_data = {
            "email": f"buyer_{uuid.uuid4().hex[:8]}@test.com",
            "password": "testpass123",
            "user_type": "buyer",
            "full_name": "Test Buyer",
            "phone_number": "+1234567890"
        }
        
        buyer_response = await self.make_request("POST", "/register", buyer_data)
        if not buyer_response:
            return False
            
        self.buyer_id = buyer_response["user"]["id"]
        print(f"✅ Buyer registered: {buyer_response['user']['email']}")
        
        # Register seller
        seller_data = {
            "email": f"seller_{uuid.uuid4().hex[:8]}@test.com",
            "password": "testpass123",
            "user_type": "seller",
            "full_name": "Test Seller",
            "phone_number": "+1234567891",
            "store_name": "Demo Store",
            "store_description": "Test store for demo"
        }
        
        seller_response = await self.make_request("POST", "/register", seller_data)
        if not seller_response:
            return False
            
        self.seller_id = seller_response["user"]["id"]
        print(f"✅ Seller registered: {seller_response['user']['email']}")
        
        # Login both users
        buyer_login = await self.make_request("POST", "/login", {
            "email": buyer_data["email"],
            "password": buyer_data["password"]
        })
        
        seller_login = await self.make_request("POST", "/login", {
            "email": seller_data["email"],
            "password": seller_data["password"]
        })
        
        if buyer_login and seller_login:
            self.buyer_token = buyer_login["access_token"]
            self.seller_token = seller_login["access_token"]
            print("✅ Both users logged in successfully")
            return True
            
        return False
        
    async def create_product_with_inventory(self):
        """Create a product with inventory batches"""
        print("\n📦 Creating product with inventory...")
        
        headers = {"Authorization": f"Bearer {self.seller_token}"}
        
        # Create product
        product_data = {
            "name": "Demo Smartphone",
            "description": "Latest smartphone with amazing features",
            "base_price": 25000.00,
            "category": "Electronics",
            "is_bargainable": True,
            "min_bargain_price": 22000.00,
            "max_bargain_price": 30000.00
        }
        
        product_response = await self.make_request(
            "POST", "/product/create", product_data, headers
        )
        
        if not product_response:
            return False
            
        self.product_id = product_response["id"]
        print(f"✅ Product created: {product_response['name']} (ID: {self.product_id})")
        
        # Add inventory batches
        inventory_batches = [
            {
                "quantity": 50,
                "batch_number": "BATCH001",
                "expiry_date": (datetime.now() + timedelta(days=365)).isoformat(),
                "discount_percentage": 0.0
            },
            {
                "quantity": 30,
                "batch_number": "BATCH002", 
                "expiry_date": (datetime.now() + timedelta(days=300)).isoformat(),
                "discount_percentage": 5.0
            }
        ]
        
        for batch in inventory_batches:
            inventory_response = await self.make_request(
                "POST", 
                f"/inventory/{self.product_id}/add-batch",
                batch,
                headers
            )
            
            if inventory_response:
                print(f"✅ Inventory batch added: {batch['batch_number']} ({batch['quantity']} units)")
                
        return True
        
    async def create_bargain_room(self):
        """Create a bargaining room"""
        print("\n🏠 Creating bargain room...")
        
        headers = {"Authorization": f"Bearer {self.seller_token}"}
        
        room_data = {
            "product_id": self.product_id,
            "room_type": "public",
            "initial_price": 26000.00,
            "quantity": 2,
            "description": "Bargaining for 2 smartphones - Best offer wins!"
        }
        
        room_response = await self.make_request(
            "POST", "/bargain/room/create", room_data, headers
        )
        
        if not room_response:
            return False
            
        self.room_id = room_response["id"]
        print(f"✅ Bargain room created: {room_response['description']}")
        print(f"   Room ID: {self.room_id}")
        print(f"   Initial Price: ₹{room_response['current_bid_price']}")
        print(f"   Quantity: {room_response['quantity']}")
        
        return True
        
    async def simulate_bargaining(self):
        """Simulate some bargaining activity"""
        print("\n💰 Simulating bargaining activity...")
        
        buyer_headers = {"Authorization": f"Bearer {self.buyer_token}"}
        seller_headers = {"Authorization": f"Bearer {self.seller_token}"}
        
        # Buyer places initial bid
        bid_data = {
            "bid_price": 24000.00,
            "quantity": 2,
            "message": "Looking for a good deal on these phones!"
        }
        
        bid_response = await self.make_request(
            "POST", 
            f"/bargain/room/{self.room_id}/bid",
            bid_data,
            buyer_headers
        )
        
        if bid_response:
            print(f"✅ Buyer bid placed: ₹{bid_response['bid_price']}")
            
        # Wait a bit
        await asyncio.sleep(1)
        
        # Seller places counter offer
        counter_data = {
            "bid_price": 25500.00,
            "quantity": 2,
            "message": "I can offer a small discount, but these are premium phones",
            "is_counter_offer": True
        }
        
        counter_response = await self.make_request(
            "POST",
            f"/bargain/room/{self.room_id}/bid", 
            counter_data,
            seller_headers
        )
        
        if counter_response:
            print(f"✅ Seller counter-offer: ₹{counter_response['bid_price']}")
            
        # Add some chat messages
        chat_messages = [
            ("buyer", "Are these phones brand new?"),
            ("seller", "Yes, absolutely! All phones come with 1-year warranty"),
            ("buyer", "Can you include free shipping?"),
            ("seller", "Free shipping is included for orders above ₹20,000")
        ]
        
        for user_type, message in chat_messages:
            headers = buyer_headers if user_type == "buyer" else seller_headers
            await self.make_request(
                "POST",
                f"/bargain/room/{self.room_id}/message",
                {"content": message},
                headers
            )
            print(f"💬 {user_type.title()}: {message}")
            await asyncio.sleep(0.5)
            
        return True
        
    async def display_room_info(self):
        """Display current room information"""
        print("\n📊 Current Room Status:")
        
        headers = {"Authorization": f"Bearer {self.buyer_token}"}
        room_info = await self.make_request(
            "GET", f"/bargain/room/{self.room_id}", headers=headers
        )
        
        if room_info:
            print(f"   Room Type: {room_info['room_type']}")
            print(f"   Status: {room_info['status']}")
            print(f"   Current Bid: ₹{room_info['current_bid_price']}")
            print(f"   Quantity: {room_info['quantity']}")
            print(f"   Total Bids: {len(room_info.get('bids', []))}")
            print(f"   Total Messages: {len(room_info.get('messages', []))}")
            
    async def display_websocket_info(self):
        """Display WebSocket connection information"""
        print("\n🔌 WebSocket Demo Information:")
        print("=" * 50)
        print("You can now test real-time bargaining using:")
        print()
        print("1. Python Client:")
        print(f"   python websocket_demo.py {self.room_id} {self.buyer_token}")
        print(f"   python websocket_demo.py {self.room_id} {self.seller_token}")
        print()
        print("2. HTML Client:")
        print("   Open websocket_demo.html in your browser")
        print(f"   Room ID: {self.room_id}")
        print(f"   Buyer Token: {self.buyer_token}")
        print(f"   Seller Token: {self.seller_token}")
        print()
        print("3. WebSocket URL:")
        print(f"   ws://localhost:8000/api/v1/bargain/{self.room_id}/ws?token=YOUR_TOKEN")
        print()
        print("Try these actions in the WebSocket clients:")
        print("• Send chat messages")
        print("• Check recent activity")
        print("• Send typing indicators")
        print("• Place new bids (use the HTTP API)")
        print("• Accept bargains (use the HTTP API)")
        print()
        
    async def run_demo(self):
        """Run the complete demo"""
        print("🚀 Starting E-commerce Bargaining System Demo")
        print("=" * 50)
        
        try:
            await self.create_session()
            
            # Step 1: Register users
            if not await self.register_users():
                print("❌ Failed to register users")
                return
                
            # Step 2: Create product with inventory
            if not await self.create_product_with_inventory():
                print("❌ Failed to create product")
                return
                
            # Step 3: Create bargain room
            if not await self.create_bargain_room():
                print("❌ Failed to create bargain room")
                return
                
            # Step 4: Simulate bargaining
            if not await self.simulate_bargaining():
                print("❌ Failed to simulate bargaining")
                return
                
            # Step 5: Display current status
            await self.display_room_info()
            
            # Step 6: Display WebSocket demo info
            await self.display_websocket_info()
            
            print("✅ Demo completed successfully!")
            print("\nNow you can test real-time features with the WebSocket clients.")
            
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            
        finally:
            await self.close_session()

async def main():
    """Main function"""
    demo = EcommerceDemo()
    await demo.run_demo()

if __name__ == "__main__":
    # Check if required packages are available
    try:
        import aiohttp
    except ImportError:
        print("❌ aiohttp package is required. Install with: pip install aiohttp")
        exit(1)
        
    print("Starting demo in 3 seconds...")
    print("Make sure your backend server is running on localhost:8000")
    
    asyncio.run(main())
