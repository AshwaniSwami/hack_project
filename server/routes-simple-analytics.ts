import { Express, Request, Response } from "express";
import { Pool } from 'pg';

// Direct database connection for analytics
function createDirectConnection() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export function registerAnalyticsRoutes(app: Express) {
  // Get analytics overview with REAL DATA from database
  app.get("/api/analytics/overview", async (req: Request, res: Response) => {
    try {
      // Check authentication via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const pool = createDirectConnection();
      if (!pool) {
        return res.json({
          totalUsers: 0,
          totalProjects: 0,
          totalFiles: 0,
          totalDownloads: 0,
          recentActivity: [],
          message: "Database not available - showing empty state"
        });
      }

      console.log("[ANALYTICS] Fetching real data from database...");

      try {
        // Get real counts from database using direct SQL
        const [userCount, fileCount, downloadCount] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM users'),
          pool.query('SELECT COUNT(*) as count FROM files'),
          pool.query('SELECT COUNT(*) as count FROM download_logs')
        ]);

        // Get recent download activity
        const recentActivity = await pool.query(`
          SELECT 
            dl.id,
            'download' as type,
            CONCAT('Downloaded ', COALESCE(f.original_name, f.filename, 'unknown file')) as description,
            dl.created_at as timestamp,
            dl.user_name as user,
            dl.entity_type,
            dl.entity_id
          FROM download_logs dl
          LEFT JOIN files f ON dl.file_id = f.id
          ORDER BY dl.created_at DESC
          LIMIT 10
        `);

        const response = {
          totalUsers: parseInt(userCount.rows[0]?.count || '0'),
          totalProjects: 0, // Will be populated when projects are available
          totalFiles: parseInt(fileCount.rows[0]?.count || '0'),
          totalDownloads: parseInt(downloadCount.rows[0]?.count || '0'),
          recentActivity: recentActivity.rows.map(activity => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            timestamp: activity.timestamp,
            user: activity.user,
            entityType: activity.entity_type,
            entityId: activity.entity_id
          }))
        };

        console.log(`[ANALYTICS] Real data: ${response.totalUsers} users, ${response.totalFiles} files, ${response.totalDownloads} downloads`);
        res.json(response);

      } finally {
        await pool.end();
      }

    } catch (error) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ 
        error: "Failed to fetch overview analytics",
        totalUsers: 0,
        totalProjects: 0,
        totalFiles: 0,
        totalDownloads: 0,
        recentActivity: []
      });
    }
  });

  // Get download analytics overview with REAL DATA
  app.get("/api/analytics/downloads/overview", async (req: Request, res: Response) => {
    try {
      // Check authentication via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { timeframe = '7d' } = req.query;
      
      const pool = createDirectConnection();
      if (!pool) {
        return res.json({
          timeframe,
          totalDownloads: 0,
          uniqueDownloaders: 0,
          totalDataDownloaded: 0,
          popularFiles: [],
          downloadsByDay: [],
          downloadsByType: [],
          downloadsByHour: Array.from({length: 24}, (_, i) => ({ hour: i, count: 0 })),
          message: "Database not available - showing empty state"
        });
      }
      
      console.log(`[ANALYTICS] Fetching download data for timeframe: ${timeframe}`);

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
        // Get total downloads in timeframe
        const totalDownloadsResult = await pool.query(
          'SELECT COUNT(*) as count FROM download_logs WHERE created_at >= $1',
          [startDate]
        );

        // Get unique downloaders count
        const uniqueDownloadersResult = await pool.query(
          'SELECT COUNT(DISTINCT user_id) as count FROM download_logs WHERE created_at >= $1',
          [startDate]
        );

        // Get total data downloaded
        const totalDataResult = await pool.query(
          'SELECT SUM(download_size) as total FROM download_logs WHERE created_at >= $1',
          [startDate]
        );

        // Get popular files
        const popularFilesResult = await pool.query(`
          SELECT 
            dl.file_id,
            f.filename,
            f.original_name,
            dl.entity_type,
            dl.entity_id,
            COUNT(*) as download_count,
            SUM(dl.download_size) as total_size
          FROM download_logs dl
          LEFT JOIN files f ON dl.file_id = f.id
          WHERE dl.created_at >= $1
          GROUP BY dl.file_id, f.filename, f.original_name, dl.entity_type, dl.entity_id
          ORDER BY COUNT(*) DESC
          LIMIT 10
        `, [startDate]);

        // Get downloads by day
        const downloadsByDayResult = await pool.query(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as unique_users,
            SUM(download_size) as total_size
          FROM download_logs 
          WHERE created_at >= $1
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at)
        `, [startDate]);

        // Get downloads by entity type
        const downloadsByTypeResult = await pool.query(`
          SELECT 
            entity_type,
            COUNT(*) as count,
            SUM(download_size) as total_size
          FROM download_logs 
          WHERE created_at >= $1
          GROUP BY entity_type
          ORDER BY COUNT(*) DESC
        `, [startDate]);

        // Get downloads by hour
        const downloadsByHourResult = await pool.query(`
          SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as count
          FROM download_logs 
          WHERE created_at >= $1
          GROUP BY EXTRACT(HOUR FROM created_at)
          ORDER BY EXTRACT(HOUR FROM created_at)
        `, [startDate]);

        // Format response with REAL data
        const response = {
          timeframe,
          totalDownloads: parseInt(totalDownloadsResult.rows[0]?.count || '0'),
          uniqueDownloaders: parseInt(uniqueDownloadersResult.rows[0]?.count || '0'),
          totalDataDownloaded: parseInt(totalDataResult.rows[0]?.total || '0'),
          popularFiles: popularFilesResult.rows.map(file => ({
            fileId: file.file_id,
            filename: file.filename || 'Unknown file',
            originalName: file.original_name || file.filename || 'Unknown file',
            entityType: file.entity_type,
            entityId: file.entity_id,
            downloadCount: parseInt(file.download_count),
            totalSize: parseInt(file.total_size || '0')
          })),
          downloadsByDay: downloadsByDayResult.rows.map(day => ({
            date: day.date,
            count: parseInt(day.count),
            uniqueUsers: parseInt(day.unique_users),
            totalSize: parseInt(day.total_size || '0')
          })),
          downloadsByType: downloadsByTypeResult.rows.map(type => ({
            entityType: type.entity_type,
            count: parseInt(type.count),
            totalSize: parseInt(type.total_size || '0')
          })),
          downloadsByHour: Array.from({length: 24}, (_, hour) => {
            const found = downloadsByHourResult.rows.find(h => parseInt(h.hour) === hour);
            return {
              hour,
              count: found ? parseInt(found.count) : 0
            };
          })
        };

        console.log(`[ANALYTICS] Real download data: ${response.totalDownloads} downloads, ${response.uniqueDownloaders} users`);
        res.json(response);

      } finally {
        await pool.end();
      }

    } catch (error) {
      console.error("Download analytics error:", error);
      res.status(500).json({ 
        error: "Failed to fetch analytics",
        timeframe: req.query.timeframe || '7d',
        totalDownloads: 0,
        uniqueDownloaders: 0,
        totalDataDownloaded: 0,
        popularFiles: [],
        downloadsByDay: [],
        downloadsByType: [],
        downloadsByHour: Array.from({length: 24}, (_, i) => ({ hour: i, count: 0 }))
      });
    }
  });

  // File download analytics with REAL DATA
  app.get("/api/analytics/files/:fileId", async (req: Request, res: Response) => {
    try {
      // Check authentication via session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { fileId } = req.params;
      const pool = createDirectConnection();
      
      if (!pool) {
        return res.json({
          fileId,
          totalDownloads: 0,
          uniqueDownloaders: 0,
          downloadHistory: [],
          message: "Database not available"
        });
      }

      try {
        // Get file download stats
        const [downloadStats, downloadHistory] = await Promise.all([
          pool.query(`
            SELECT 
              COUNT(*) as count, 
              COUNT(DISTINCT user_id) as unique_users,
              SUM(download_size) as total_size
            FROM download_logs 
            WHERE file_id = $1
          `, [fileId]),
          
          pool.query(`
            SELECT 
              id,
              user_id,
              user_name,
              user_email,
              download_size,
              download_duration,
              ip_address,
              user_agent,
              created_at
            FROM download_logs 
            WHERE file_id = $1
            ORDER BY created_at DESC
            LIMIT 50
          `, [fileId])
        ]);

        const response = {
          fileId,
          totalDownloads: parseInt(downloadStats.rows[0]?.count || '0'),
          uniqueDownloaders: parseInt(downloadStats.rows[0]?.unique_users || '0'),
          totalDataTransferred: parseInt(downloadStats.rows[0]?.total_size || '0'),
          downloadHistory: downloadHistory.rows.map(download => ({
            id: download.id,
            userId: download.user_id,
            userName: download.user_name,
            userEmail: download.user_email,
            downloadSize: download.download_size,
            downloadDuration: download.download_duration,
            ipAddress: download.ip_address,
            userAgent: download.user_agent,
            timestamp: download.created_at
          }))
        };

        console.log(`[ANALYTICS] File ${fileId} real data: ${response.totalDownloads} downloads`);
        res.json(response);

      } finally {
        await pool.end();
      }

    } catch (error) {
      console.error(`File analytics error for ${req.params.fileId}:`, error);
      res.status(500).json({ 
        error: "Failed to fetch file analytics",
        fileId: req.params.fileId,
        totalDownloads: 0,
        uniqueDownloaders: 0,
        downloadHistory: []
      });
    }
  });
}