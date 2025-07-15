import React, { useState, useEffect } from 'react';
import { Bell, X, Check, User, UserCheck, UserPlus, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

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
  const [location, navigate] = useLocation();

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
      // Force refresh to update the UI immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/notifications/unread'] });
      }, 100);
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
      setOpen(false); // Close the popover after marking all as read
      // Force refresh to update the UI immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/notifications/unread'] });
      }, 100);
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
      // Force refresh to update the UI immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/notifications/unread'] });
      }, 100);
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = (allNotifications || []).sort((a: Notification, b: Notification) => {
    // Sort by read status first (unread first), then by priority, then by date
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    
    // Priority ranking: urgent > high > normal > low
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleNotificationClick = (notification: Notification) => {
    // Always mark as read and close the panel first
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    setOpen(false); // Close the notification panel immediately
    
    // Small delay to ensure smooth transition, then navigate
    setTimeout(() => {
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      } else if (notification.type === 'user_verification_request') {
        navigate('/users');
      }
    }, 100);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'normal': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_verification_request':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'user_registered':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
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
      <PopoverContent className="w-96 p-0" side="bottom" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Notifications {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
              </CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending || deleteNotificationMutation.isPending}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  {markAllAsReadMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 ${
                        getPriorityColor(notification.priority)
                      } ${!notification.isRead ? 'shadow-sm' : 'opacity-75'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                  {notification.title.replace(/🔍\s*/, '').replace(/👤\s*/, '')}
                                </h4>
                                {!notification.isRead && (
                                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.relatedUserEmail && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 inline-block">
                                  <User className="h-3 w-3 inline mr-1" />
                                  <span className="font-medium">{notification.relatedUserEmail}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                disabled={deleteNotificationMutation.isPending}
                                title="Delete notification"
                              >
                                {deleteNotificationMutation.isPending ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                                ) : (
                                  <X className="h-3 w-3 text-red-500" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <div className="flex items-center space-x-2">
                              {notification.isRead && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">Read</span>
                              )}
                            </div>
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