import { io } from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.typingHandlers = [];
    this.connectionHandlers = [];
  }

  // Initialize socket connection
  connect(userId, userRole) {
    if (this.socket) {
      console.log('Socket already connected');
      return;
    }

    // In production (Vercel), use relative URLs to work with the same domain
    let SOCKET_URL;
    if (import.meta.env.PROD) {
      // In production, use the same domain as frontend for WebSocket
      SOCKET_URL = window.location.origin;
    } else {
      // In development, use the full localhost URL
      SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          userId,
          userRole
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.setupEventListeners();
      
      console.log('Socket connection initiated for user:', userId);
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.notifyConnectionHandlers(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    // Message events
    this.socket.on('message:received', (data) => {
      console.log('Message received:', data);
      this.notifyMessageHandlers(data);
    });

    // Typing events
    this.socket.on('user:typing', (data) => {
      console.log('User typing:', data);
      this.notifyTypingHandlers(data);
    });

    // User status events
    this.socket.on('user:online', (data) => {
      console.log('User online:', data);
    });

    this.socket.on('user:offline', (data) => {
      console.log('User offline:', data);
    });
  }

  // Send a message
  sendMessage(recipientId, message, recipientRole) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      const messageData = {
        recipientId,
        recipientRole,
        message,
        timestamp: new Date().toISOString()
      };

      this.socket.emit('message:send', messageData, (response) => {
        if (response.success) {
          console.log('Message sent successfully:', response);
          resolve(response.data);
        } else {
          console.error('Failed to send message:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  // Send typing indicator
  sendTypingIndicator(recipientId, isTyping) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('user:typing', {
      recipientId,
      isTyping
    });
  }

  // Get chat history
  getChatHistory(contactId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('chat:getHistory', { contactId }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // Get contacts list
  getContacts() {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('chat:getContacts', {}, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // Register message handler
  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Register typing handler
  onTyping(handler) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  // Register connection handler
  onConnectionChange(handler) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  // Notify message handlers
  notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  // Notify typing handlers
  notifyTypingHandlers(data) {
    this.typingHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in typing handler:', error);
      }
    });
  }

  // Notify connection handlers
  notifyConnectionHandlers(isConnected) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(isConnected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected manually');
    }
  }

  // Check if connected
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService;
