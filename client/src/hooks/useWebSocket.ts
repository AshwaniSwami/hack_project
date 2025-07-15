import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedUserId?: string;
  relatedUserEmail?: string;
  relatedUserName?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  showPopup?: boolean;
}

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Authenticate with the server
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id,
          userRole: user.role
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'authenticated':
              console.log('WebSocket authenticated successfully');
              break;
              
            case 'notification':
              if (message.data && message.data.showPopup) {
                const notification: NotificationData = {
                  id: message.data.id,
                  type: message.data.type,
                  title: message.data.title,
                  message: message.data.message,
                  relatedUserId: message.data.relatedUserId,
                  relatedUserEmail: message.data.relatedUserEmail,
                  relatedUserName: message.data.relatedUserName,
                  priority: message.data.priority,
                  createdAt: message.data.createdAt,
                  showPopup: true
                };
                
                setNotifications(prev => [...prev, notification]);
                
                // Auto-remove notification after 5 seconds
                setTimeout(() => {
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                }, 5000);
              }
              break;
              
            case 'error':
              console.error('WebSocket error:', message.message);
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Reconnect after 3 seconds if user is still admin
        if (user && user.role === 'admin') {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.role]);

  return {
    isConnected,
    notifications,
    dismissNotification,
    connect,
    disconnect
  };
}