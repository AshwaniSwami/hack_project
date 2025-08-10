import type { Express } from "express";
import { storage } from "./storage";

export function registerUserManagementRoutes(app: Express) {
  // Import auth dynamically to avoid circular dependency
  const getAuthModule = async () => {
    const { isDatabaseAvailable } = await import("./db");
    const dbAvailable = await isDatabaseAvailable();
    return dbAvailable ? await import("./auth") : await import("./tempAuth");
  };

  // Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const auth = await getAuthModule();
      
      // Check authentication first
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check admin access
      const user = await storage.getUserById(req.session.userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Don't allow deleting the current admin user
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete the user
      await storage.deleteUser(userId);
      
      console.log(`Admin ${req.session.userEmail} deleted user ${user.email} (${userId})`);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update user role (admin only)  
  app.patch("/api/admin/users/:userId/role", async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!["admin", "editor", "member"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Don't allow changing own role
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      await storage.updateUserRole(userId, role);
      
      const user = await storage.getUserById(userId);
      console.log(`Admin ${req.session.userEmail} changed role of ${user?.email} to ${role}`);
      
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Clean up problematic download logs
  app.post("/api/admin/cleanup-logs", async (req, res) => {
    try {
      await storage.cleanupDownloadLogs();
      res.json({ message: "Download logs cleaned up successfully" });
    } catch (error) {
      console.error("Error cleaning up logs:", error);
      res.status(500).json({ message: "Failed to cleanup logs" });
    }
  });
}