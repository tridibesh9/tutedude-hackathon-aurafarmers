// WebSocket utility for managing bargain connections
export class BargainWebSocket {
  constructor(bargainId, token, onMessage, onError) {
    this.bargainId = bargainId;
    this.token = token;
    this.onMessage = onMessage;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = false;
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `ws://localhost:8000/api/v1/bargain/${this.bargainId}/ws?token=${this.token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to bargain room:', this.bargainId);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onMessage({ type: 'connection_status', connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected from bargain room:', this.bargainId);
        this.isConnecting = false;
        this.onMessage({ type: 'connection_status', connected: false });
        
        // Attempt to reconnect if not a clean close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Reconnecting to WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        if (this.onError) {
          this.onError('WebSocket connection error');
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      if (this.onError) {
        this.onError('Failed to create WebSocket connection');
      }
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// API utility functions for bargain operations
export const bargainAPI = {
  // Create a new bargain
  createBargain: async (bargainData) => {
    const token = localStorage.getItem('token');
    const endpoint = bargainData.type === 'public' 
      ? '/api/v1/bargain/public/create'
      : '/api/v1/bargain/private/create';

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bargainData)
    });

    return response.json();
  },

  // Get public bargains
  getPublicBargains: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters);
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/public/available?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  },

  // Get user's bargains
  getMyBargains: async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:8000/api/v1/bargain/my-bargains', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  },

  // Get bargain details
  getBargainDetails: async (bargainId) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  },

  // Place a bid
  placeBid: async (bargainId, bidData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/bid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bidData)
    });

    return response.json();
  },

  // Accept a bid
  acceptBid: async (bargainId) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  // Respond to public bargain
  respondToPublicBargain: async (bargainId, responseData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/public/${bargainId}/respond`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    });

    return response.json();
  },

  // Get bid history
  getBidHistory: async (bargainId) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  },

  // Get chat messages
  getChatMessages: async (bargainId) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/chat`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  },

  // Send chat message
  sendChatMessage: async (bargainId, messageData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    return response.json();
  }
};

// Utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatTimeRemaining = (expiryTime) => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.user_id,
      name: payload.name,
      role: payload.role,
      email: payload.email
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};
