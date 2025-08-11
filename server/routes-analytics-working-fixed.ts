import type { Express, Request, Response } from "express";
import { eq, desc, count, sum, sql, gte, and } from "drizzle-orm";
import { 
  files, 
  downloadLogs, 
  projects, 
  episodes, 
  scripts, 
  users 
} from "@shared/schema";
import { requireDatabase } from "./db";

// Define the authenticated request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Authentication middleware placeholder
const isAuthenticated = (req: any, res: any, next: any) => next();

export function registerWorkingAnalyticsRoutes(app: Express) {
  
  // Get file analytics with correct column references
  app.get("/api/analytics/files", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      try {
        const db = requireDatabase();
        
        // Get files with correct column references - using createdAt instead of uploaded_at
        const fileAnalytics = await db
          .select({
            id: files.id,
            filename: files.filename,
            originalName: files.originalName,
            entityType: files.entityType,
            fileSize: files.fileSize,
            uploadedBy: files.uploadedBy, // This column exists
            createdAt: files.createdAt, // Use createdAt instead of uploaded_at
            downloadCount: files.downloadCount,
            lastAccessedAt: files.lastAccessedAt
          })
          .from(files)
          .where(gte(files.createdAt, startDate))
          .orderBy(desc(files.createdAt))
          .limit(50);

        console.log(`[ANALYTICS] Found ${fileAnalytics.length} files`);

        res.json(fileAnalytics || []);

      } catch (dbError) {
        console.error("File analytics error:", dbError);
        res.json([]);
      }

    } catch (error) {
      console.error("File analytics error:", error);
      res.status(500).json({ error: "Failed to fetch file analytics" });
    }
  });

  // Get user downloads with correct column references  
  app.get("/api/analytics/downloads/users", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        timeframe = '7d', 
        search = '',
        limit = '50'
      } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h': startDate.setDate(now.getDate() - 1); break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        default: startDate.setDate(now.getDate() - 7);
      }

      try {
        const db = requireDatabase();
        
        // Use correct column references - firstName and lastName instead of u.name
        let query = db
          .select({
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName, // This is stored in downloadLogs
            userRole: downloadLogs.userRole,
            downloadCount: count(downloadLogs.id),
            totalSize: sum(downloadLogs.downloadSize),
            lastDownload: sql<string>`MAX(${downloadLogs.downloadedAt})`,
            // Get user details from users table using correct columns
            firstName: users.firstName,
            lastName: users.lastName
          })
          .from(downloadLogs)
          .leftJoin(users, eq(downloadLogs.userId, users.id))
          .where(gte(downloadLogs.downloadedAt, startDate))
          .groupBy(
            downloadLogs.userId, 
            downloadLogs.userEmail, 
            downloadLogs.userName, 
            downloadLogs.userRole,
            users.firstName,
            users.lastName
          )
          .orderBy(desc(count(downloadLogs.id)))
          .limit(parseInt(limit as string));

        const userDownloads = await query;

        res.json(userDownloads || []);

      } catch (dbError) {
        console.error("User downloads error:", dbError);
        res.json([]);
      }

    } catch (error) {
      console.error("User downloads error:", error);
      res.status(500).json({ error: "Failed to fetch user downloads" });
    }
  });

  // Get download logs with correct schema
  app.get("/api/analytics/downloads/logs", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        timeframe = '7d', 
        entityType = 'all',
        status = 'all',
        page = '1',
        limit = '50'
      } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case '24h': startDate.setDate(now.getDate() - 1); break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        default: startDate.setDate(now.getDate() - 7);
      }

      try {
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        let whereConditions = [gte(downloadLogs.downloadedAt, startDate)];
        
        if (entityType !== 'all') {
          whereConditions.push(eq(downloadLogs.entityType, entityType as string));
        }
        
        if (status !== 'all') {
          whereConditions.push(eq(downloadLogs.downloadStatus, status as string));
        }

        const db = requireDatabase();
        const logs = await db
          .select({
            id: downloadLogs.id,
            fileId: downloadLogs.fileId,
            filename: files.filename,
            originalName: files.originalName,
            userId: downloadLogs.userId,
            userEmail: downloadLogs.userEmail,
            userName: downloadLogs.userName,
            userRole: downloadLogs.userRole,
            ipAddress: downloadLogs.ipAddress,
            downloadSize: downloadLogs.downloadSize,
            downloadDuration: downloadLogs.downloadDuration,
            downloadStatus: downloadLogs.downloadStatus,
            entityType: downloadLogs.entityType,
            refererPage: downloadLogs.refererPage,
            downloadedAt: downloadLogs.downloadedAt
          })
          .from(downloadLogs)
          .leftJoin(files, eq(downloadLogs.fileId, files.id))
          .where(and(...whereConditions))
          .orderBy(desc(downloadLogs.downloadedAt))
          .offset(offset)
          .limit(parseInt(limit as string));

        // Get total count for pagination
        const totalResult = await db
          .select({ count: count() })
          .from(downloadLogs)
          .where(and(...whereConditions));

        console.log(`[ANALYTICS] Download logs: ${logs.length} results`);

        res.json({
          logs: logs || [],
          total: totalResult[0]?.count || 0,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil((totalResult[0]?.count || 0) / parseInt(limit as string))
        });

      } catch (dbError) {
        console.error("Download logs error:", dbError);
        res.json({
          logs: [],
          total: 0,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: 0
        });
      }

    } catch (error) {
      console.error("Download logs error:", error);
      res.status(500).json({ error: "Failed to fetch download logs" });
    }
  });
}