import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated, isAdmin, type AuthenticatedRequest } from "./auth";
import { insertNotificationSchema, type InsertNotification } from "@shared/schema";

export function registerNotificationRoutes(app: Express) {
  // Get all notifications for current user (admin only)
  app.get("/api/notifications", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notifications count for current user (admin only)
  app.get("/api/notifications/unread", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const unreadNotifications = await storage.getUnreadNotifications(req.user!.id);
      res.json({ count: unreadNotifications.length, notifications: unreadNotifications });
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notificationId = req.params.id;
      
      // Verify the notification belongs to the current user
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notificationId = req.params.id;
      
      // Verify the notification belongs to the current user
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteNotification(notificationId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
}

// Helper function to create a notification for all admin users
export async function createAdminNotification(
  type: string, 
  title: string, 
  message: string, 
  relatedUserId?: string, 
  relatedUserEmail?: string, 
  relatedUserName?: string,
  actionUrl?: string,
  priority: "low" | "normal" | "high" | "urgent" = "normal"
): Promise<void> {
  try {
    // Get all admin users
    const adminUsers = await storage.getAdminUsers();
    
    // Create concise, relevant messages based on notification type
    let finalTitle = title;
    let finalMessage = message;
    
    if (type === 'user_verification_request') {
      finalTitle = '🔍 User Verification Required';
      finalMessage = `${relatedUserEmail} has registered and needs approval to access the platform.`;
    } else if (type === 'user_registered') {
      finalTitle = '👤 New User Registration';
      finalMessage = `${relatedUserEmail} has successfully registered and been approved.`;
    }
    
    // Create notification for each admin user
    for (const admin of adminUsers) {
      const notification: InsertNotification = {
        userId: admin.id,
        type,
        title: finalTitle,
        message: finalMessage,
        relatedUserId,
        relatedUserEmail,
        relatedUserName,
        actionUrl: actionUrl || (type === 'user_verification_request' ? '/users' : undefined),
        priority,
        isRead: false,
        isArchived: false,
        metadata: relatedUserId ? { relatedUserId, relatedUserEmail, relatedUserName } : undefined,
      };

      const createdNotification = await storage.createNotification(notification);
      
      console.log(`Notification sent to admin user ${admin.id}`);
      
      // Broadcast real-time notification to connected admin users
      if (typeof (global as any).broadcastNotificationToAdmins === 'function') {
        (global as any).broadcastNotificationToAdmins({
          ...createdNotification,
          type: 'new_notification',
          showPopup: true
        });
      }
    }
  } catch (error) {
    console.error("Error creating admin notifications:", error);
    // Don't throw error to avoid breaking the main flow
  }
}