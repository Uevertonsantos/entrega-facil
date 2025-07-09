import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export interface WebSocketMessage {
  type: string;
  payload?: any;
  timestamp?: string;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Register client if user is admin
        if (user?.email === 'admin@deliveryexpress.com') {
          sendMessage({
            type: 'client_register',
            clientId: 'admin_panel'
          });
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setMessages(prev => [...prev.slice(-49), message]); // Keep last 50 messages
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        attemptReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      console.log(`Attempting to reconnect WebSocket (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000); // Wait 5 seconds before reconnecting
    } else {
      console.log('Max reconnect attempts reached');
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (isConnected) {
        sendMessage({ type: 'ping' });
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect
  };
}