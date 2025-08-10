
import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { downloadLogs, files } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

interface DownloadTrackingRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  downloadStartTime?: number;
}

export function trackDownload(fileId: string, entityType: string, entityId: string) {
  return async (req: DownloadTrackingRequest, res: Response, next: NextFunction) => {
    const downloadStartTime = Date.now();
    req.downloadStartTime = downloadStartTime;

    // Get user info from session or request
    let userId = 'anonymous';
    let userEmail = 'anonymous@example.com';
    let userName = 'Anonymous User';
    let userRole = 'guest';

    if (req.user) {
      userId = req.user.id;
      userEmail = req.user.email;
      userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      userRole = req.user.role;
    } else if (req.session && (req.session as any).userId) {
      userId = (req.session as any).userId;
      userEmail = (req.session as any).userEmail || 'session@example.com';
      userName = (req.session as any).userName || 'Session User';
      userRole = (req.session as any).userRole || 'member';
    }

    // Get client IP address
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.headers['x-forwarded-for'] as string || 
                     'unknown';

    // Get referer
    const refererPage = req.get('Referer') || req.originalUrl;

    try {
      if (db) {
        // Get file information
        const fileInfo = await db
          .select({
            filename: files.filename,
            originalName: files.originalName,
            fileSize: files.fileSize
          })
          .from(files)
          .where(eq(files.id, fileId))
          .limit(1);

        const filename = fileInfo[0]?.filename || 'unknown';
        const originalName = fileInfo[0]?.originalName || 'unknown';
        const fileSize = fileInfo[0]?.fileSize || 0;

        console.log(`[DOWNLOAD TRACKING] Starting download: ${originalName} by ${userName}`);

        // Hook into response finish to log completion
        res.on('finish', async () => {
          const downloadEndTime = Date.now();
          const downloadDuration = downloadEndTime - downloadStartTime;
          
          let downloadStatus = 'completed';
          if (res.statusCode >= 400) {
            downloadStatus = 'failed';
          } else if (res.statusCode === 206) {
            downloadStatus = 'partial';
          }

          try {
            await db.insert(downloadLogs).values({
              id: randomUUID(),
              fileId: fileId,
              userId: userId,
              userEmail: userEmail,
              userName: userName,
              userRole: userRole,
              ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
              downloadSize: fileSize,
              downloadDuration: downloadDuration,
              downloadStatus: downloadStatus,
              entityType: entityType,
              entityId: entityId,
              refererPage: refererPage,
              downloadedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            });

            console.log(`[DOWNLOAD TRACKING] Logged download: ${originalName} - ${downloadStatus} - ${downloadDuration}ms`);
          } catch (error) {
            console.error('[DOWNLOAD TRACKING] Failed to log download:', error);
          }
        });

        // Hook into response error
        res.on('error', async (error) => {
          const downloadEndTime = Date.now();
          const downloadDuration = downloadEndTime - downloadStartTime;

          try {
            await db.insert(downloadLogs).values({
              id: randomUUID(),
              fileId: fileId,
              userId: userId,
              userEmail: userEmail,
              userName: userName,
              userRole: userRole,
              ipAddress: ipAddress.split(',')[0].trim(),
              downloadSize: 0,
              downloadDuration: downloadDuration,
              downloadStatus: 'failed',
              entityType: entityType,
              entityId: entityId,
              refererPage: refererPage,
              downloadedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            });

            console.log(`[DOWNLOAD TRACKING] Logged failed download: ${originalName} - ${error.message}`);
          } catch (logError) {
            console.error('[DOWNLOAD TRACKING] Failed to log download error:', logError);
          }
        });
      }
    } catch (error) {
      console.error('[DOWNLOAD TRACKING] Setup error:', error);
    }

    next();
  };
}

export function registerDownloadTracking(app: Express) {
  console.log('✅ Download tracking middleware registered');
}
