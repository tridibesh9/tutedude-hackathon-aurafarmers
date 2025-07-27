import React, { useState, useEffect, useRef } from 'react';
import './LiveChat.css';

const LiveChat = ({ bargainId, websocket, connected }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, [bargainId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (websocket && connected) {
      websocket.addEventListener('message', handleWebSocketMessage);
      
      return () => {
        websocket.removeEventListener('message', handleWebSocketMessage);
      };
    }
  }, [websocket, connected]);

  const handleWebSocketMessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'chat_message':
        setMessages(prev => [...prev, data.message]);
        break;
      case 'user_typing':
        if (data.user_id !== getCurrentUserId()) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.id !== data.user_id);
            return [...filtered, { id: data.user_id, name: data.user_name }];
          });
          
          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== data.user_id));
          }, 3000);
        }
        break;
      case 'user_stopped_typing':
        setTypingUsers(prev => prev.filter(u => u.id !== data.user_id));
        break;
      case 'online_users':
        setOnlineUsers(data.users);
        break;
    }
  };

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const getCurrentUserId = () => {
    // This should be retrieved from your auth context or token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    return null;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !connected) return;

    const message = {
      type: 'chat_message',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      // Send via WebSocket
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
      } else {
        // Fallback to HTTP if WebSocket is not available
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:8000/api/v1/bargain/${bargainId}/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: newMessage.trim() })
        });
      }

      setNewMessage('');
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key !== 'Enter') {
      handleTyping();
    }
  };

  const handleTyping = () => {
    if (!connected || !websocket) return;

    if (!isTyping) {
      setIsTyping(true);
      websocket.send(JSON.stringify({
        type: 'user_typing',
        bargain_id: bargainId
      }));
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping && websocket && connected) {
      setIsTyping(false);
      websocket.send(JSON.stringify({
        type: 'user_stopped_typing',
        bargain_id: bargainId
      }));
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message) => {
    return message.user_id === getCurrentUserId();
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="live-chat">
      <div className="chat-header">
        <h4>Live Chat</h4>
        <div className="connection-indicator">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {Object.keys(messageGroups).length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <p>No messages yet</p>
            <span>Start the conversation!</span>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dayMessages]) => (
            <div key={date}>
              <div className="date-header">
                {formatDateHeader(date)}
              </div>
              
              {dayMessages.map((message, index) => (
                <div
                  key={`${message.id || index}-${message.timestamp}`}
                  className={`message ${isMyMessage(message) ? 'my-message' : 'other-message'}`}
                >
                  {!isMyMessage(message) && (
                    <div className="message-avatar">
                      {message.user_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  
                  <div className="message-content">
                    {!isMyMessage(message) && (
                      <div className="message-header">
                        <span className="sender-name">{message.user_name || 'Anonymous'}</span>
                        <span className={`user-role ${message.user_role}`}>
                          {message.user_role}
                        </span>
                      </div>
                    )}
                    
                    <div className="message-text">
                      {message.content}
                    </div>
                    
                    <div className="message-time">
                      {formatMessageTime(message.timestamp)}
                      {isMyMessage(message) && message.status && (
                        <span className={`message-status ${message.status}`}>
                          {message.status === 'sent' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                          {message.status === 'read' && '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="typing-indicators">
            {typingUsers.map(user => (
              <div key={user.id} className="typing-indicator">
                <div className="typing-avatar">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="typing-content">
                  <span className="typing-name">{user.name}</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={connected ? "Type a message..." : "Connecting to chat..."}
            disabled={!connected}
            className="chat-input"
            rows="1"
            style={{ 
              height: 'auto',
              minHeight: '44px',
              maxHeight: '120px',
              resize: 'none'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !connected}
            className="send-button"
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
        
        {!connected && (
          <div className="connection-warning">
            Chat is temporarily unavailable. Reconnecting...
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
