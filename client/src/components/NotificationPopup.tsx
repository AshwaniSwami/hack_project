import React from 'react';
import { X, User, UserCheck, Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface NotificationPopupProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

export function NotificationPopup({ notifications, onDismiss }: NotificationPopupProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_verification_request':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'user_registered':
        return <User className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'normal': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className={cn(
            "border-l-4 shadow-lg animate-in slide-in-from-right duration-300",
            getPriorityColor(notification.priority)
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {notification.title}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {notification.priority}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 -mt-1"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {notification.message}
                </p>
                
                {notification.relatedUserEmail && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    User: {notification.relatedUserEmail}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {getPriorityIcon(notification.priority)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}