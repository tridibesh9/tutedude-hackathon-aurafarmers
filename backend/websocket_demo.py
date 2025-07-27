#!/usr/bin/env python3
"""
Demo WebSocket client for the bargaining system.
Shows how to connect to and interact with the real-time bargaining WebSocket.
"""

import asyncio
import websockets
import json
import sys

class BargainWebSocketClient:
    def __init__(self, room_id: str, jwt_token: str, base_url: str = "ws://localhost:8000"):
        self.room_id = room_id
        self.jwt_token = jwt_token
        self.ws_url = f"{base_url}/api/v1/bargain/{room_id}/ws"
        self.websocket = None
        self.authenticated = False

    async def connect_with_query_param(self):
        """Connect using JWT token as query parameter (Method 1)"""
        url_with_token = f"{self.ws_url}?token={self.jwt_token}"
        self.websocket = await websockets.connect(url_with_token)
        print(f"🔗 Connected to bargaining room: {self.room_id}")

    async def connect_with_auth_message(self):
        """Connect and authenticate with first message (Method 2)"""
        self.websocket = await websockets.connect(self.ws_url)
        
        # Send authentication message
        auth_message = {
            "type": "auth",
            "token": self.jwt_token
        }
        await self.websocket.send(json.dumps(auth_message))
        print(f"🔗 Connected to bargaining room: {self.room_id}")

    async def listen_for_messages(self):
        """Listen for incoming WebSocket messages"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            print("❌ Connection closed")

    async def handle_message(self, data: dict):
        """Handle different types of incoming messages"""
        message_type = data.get("type")
        
        if message_type == "auth_success":
            self.authenticated = True
            print("✅ Authentication successful!")
            print(f"👤 User ID: {data.get('user_id')}")
            
        elif message_type == "room_info":
            room = data.get("room", {})
            print(f"🏠 Room Info:")
            print(f"   Type: {room.get('room_type')}")
            print(f"   Status: {room.get('status')}")
            print(f"   Current Bid: ₹{room.get('current_bid_price')}")
            print(f"   Quantity: {room.get('quantity')}")
            
        elif message_type == "new_bid":
            bid = data.get("bid", {})
            print(f"💰 NEW BID from {bid.get('user_type').upper()}:")
            print(f"   Price: ₹{bid.get('bid_price')}")
            print(f"   Quantity: {bid.get('quantity')}")
            if bid.get('message'):
                print(f"   Message: {bid.get('message')}")
            print(f"   Time: {bid.get('created_at')}")
            
        elif message_type == "new_message":
            msg = data.get("message", {})
            print(f"💬 CHAT from {msg.get('user_id')}: {msg.get('content')}")
            
        elif message_type == "bargain_accepted":
            print(f"🎉 BARGAIN ACCEPTED!")
            print(f"   Final Price: ₹{data.get('final_price')}")
            print(f"   Quantity: {data.get('quantity')}")
            print(f"   Accepted Bid ID: {data.get('accepted_bid_id')}")
            
        elif message_type == "user_joined":
            print(f"👋 User {data.get('user_id')} joined the room")
            
        elif message_type == "user_left":
            print(f"👋 User {data.get('user_id')} left the room")
            
        elif message_type == "typing":
            user_id = data.get('user_id')
            is_typing = data.get('is_typing')
            if is_typing:
                print(f"✏️  {user_id} is typing...")
            
        elif message_type == "recent_activity":
            print("📋 Recent Activity:")
            bids = data.get("bids", [])
            for bid in bids[:3]:  # Show last 3 bids
                print(f"   💰 {bid['user_type']}: ₹{bid['bid_price']} (Qty: {bid['quantity']})")
            
            messages = data.get("messages", [])
            for msg in messages[:3]:  # Show last 3 messages
                print(f"   💬 {msg['user_id']}: {msg['content'][:50]}...")
                
        elif message_type == "pong":
            print("🏓 Pong received")
            
        elif message_type == "error":
            print(f"❌ Error: {data.get('message')}")
            
        else:
            print(f"❓ Unknown message type: {message_type}")
            print(f"   Data: {data}")

    async def send_ping(self):
        """Send ping to keep connection alive"""
        if self.websocket and self.authenticated:
            ping_message = {"type": "ping"}
            await self.websocket.send(json.dumps(ping_message))

    async def send_chat_message(self, content: str):
        """Send a chat message"""
        if self.websocket and self.authenticated:
            message = {
                "type": "chat_message",
                "content": content
            }
            await self.websocket.send(json.dumps(message))
            print(f"💬 Sent: {content}")

    async def send_typing_indicator(self, is_typing: bool):
        """Send typing indicator"""
        if self.websocket and self.authenticated:
            message = {
                "type": "typing",
                "is_typing": is_typing
            }
            await self.websocket.send(json.dumps(message))

    async def get_recent_activity(self):
        """Request recent activity"""
        if self.websocket and self.authenticated:
            message = {"type": "get_recent_activity"}
            await self.websocket.send(json.dumps(message))

    async def interactive_session(self):
        """Interactive session for testing"""
        print("\n🎮 Interactive Bargaining Session Started!")
        print("Commands:")
        print("  chat <message>  - Send chat message")
        print("  ping           - Send ping")
        print("  activity       - Get recent activity")
        print("  typing         - Toggle typing indicator")
        print("  quit           - Exit")
        
        while True:
            try:
                user_input = input("\n> ").strip()
                
                if user_input.lower() == "quit":
                    break
                    
                elif user_input.lower() == "ping":
                    await self.send_ping()
                    
                elif user_input.lower() == "activity":
                    await self.get_recent_activity()
                    
                elif user_input.lower() == "typing":
                    await self.send_typing_indicator(True)
                    await asyncio.sleep(2)
                    await self.send_typing_indicator(False)
                    
                elif user_input.startswith("chat "):
                    message = user_input[5:]
                    await self.send_chat_message(message)
                    
                else:
                    print("❓ Unknown command. Try: chat <message>, ping, activity, typing, or quit")
                    
            except (KeyboardInterrupt, EOFError):
                break

    async def close(self):
        """Close the WebSocket connection"""
        if self.websocket:
            await self.websocket.close()
            print("🔌 Connection closed")

async def main():
    if len(sys.argv) < 3:
        print("Usage: python websocket_demo.py <room_id> <jwt_token> [method]")
        print("Methods: query (default) or message")
        sys.exit(1)
    
    room_id = sys.argv[1]
    jwt_token = sys.argv[2]
    method = sys.argv[3] if len(sys.argv) > 3 else "query"
    
    client = BargainWebSocketClient(room_id, jwt_token)
    
    try:
        # Connect using chosen method
        if method == "message":
            await client.connect_with_auth_message()
        else:
            await client.connect_with_query_param()
        
        # Start listening for messages in background
        listen_task = asyncio.create_task(client.listen_for_messages())
        
        # Wait for authentication
        await asyncio.sleep(1)
        
        if client.authenticated:
            # Get recent activity
            await client.get_recent_activity()
            
            # Start interactive session
            interactive_task = asyncio.create_task(client.interactive_session())
            
            # Wait for either task to complete
            done, pending = await asyncio.wait(
                [listen_task, interactive_task],
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel remaining tasks
            for task in pending:
                task.cancel()
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
