// WebSocket Service for Real-Time Auction Updates
// This is a client-side service that manages WebSocket connections

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, EventCallback[]> = new Map();
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private url: string) {}

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        const wsUrl = token ? `${this.url}?token=${token}` : this.url;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.stopHeartbeat();
          this.attemptReconnect(token);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private attemptReconnect(token?: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      this.connect(token).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(data: { event: string; payload: any }) {
    const { event, payload } = data;
    this.emit(event, payload);
  }

  send(event: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', event, data);
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => callback(data));
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Auction-specific methods
  joinAuction(auctionId: string) {
    this.send('joinAuction', { auctionId });
  }

  leaveAuction(auctionId: string) {
    this.send('leaveAuction', { auctionId });
  }

  placeBid(auctionId: string, amount: number) {
    this.send('placeBid', { auctionId, amount });
  }

  // Notification-specific methods
  subscribeToNotifications(userId: string) {
    this.send('subscribeNotifications', { userId });
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!wsInstance) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    wsInstance = new WebSocketService(wsUrl);
  }
  return wsInstance;
}

export default WebSocketService;
