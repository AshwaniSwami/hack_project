import React, { useState, useEffect } from 'react';
import { Bell, X, Check, User, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedUserId?: string;
  relatedUserEmail?: string;
  relatedUserName?: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  createdAt: string;
}

interface NotificationBellProps {
  userRole: string;
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Only show for admin users
  if (userRole !== 'admin') {
    return null;
  }

  // Fetch unread notifications
  const { data: unreadData, isLoading } = useQuery({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Fetch all notifications when popover is open
  const { data: allNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: open,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/notifications/mark-all-read', {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => 
      apiRequest(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = allNotifications || [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_verification_request':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'user_registered':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="bottom" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}