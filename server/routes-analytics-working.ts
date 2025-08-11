import { Express } from 'express';
import { Pool } from 'pg';
import { isAuthenticated, type AuthenticatedRequest } from "./auth";

function createConnection() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
}

export function registerAnalyticsRoutes(app: Express) {
  // Get project analytics
  app.get("/api/analytics/projects", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT 
          p.*,
          COALESCE(f.file_count, 0) as files_count,
          COALESCE(e.episode_count, 0) as episodes_count,
          COALESCE(s.script_count, 0) as scripts_count,
          COALESCE(dl.download_count, 0) as download_count,
          COALESCE(dl.total_data_downloaded, 0) as total_data_downloaded,
          COALESCE(dl.unique_downloaders, 0) as unique_downloaders,
          dl.last_download
        FROM projects p
        LEFT JOIN (
          SELECT entity_id, COUNT(*) as file_count
          FROM files 
          WHERE entity_type = 'project'
          GROUP BY entity_id
        ) f ON p.id = f.entity_id
        LEFT JOIN (
          SELECT project_id, COUNT(*) as episode_count
          FROM episodes
          GROUP BY project_id
        ) e ON p.id = e.project_id
        LEFT JOIN (
          SELECT project_id, COUNT(*) as script_count
          FROM scripts
          GROUP BY project_id
        ) s ON p.id = s.project_id
        LEFT JOIN (
          SELECT 
            f.entity_id,
            COUNT(dl.id) as download_count,
            SUM(dl.download_size) as total_data_downloaded,
            COUNT(DISTINCT dl.user_id) as unique_downloaders,
            MAX(dl.downloaded_at) as last_download
          FROM files f
          LEFT JOIN download_logs dl ON f.id = dl.file_id
          WHERE f.entity_type = 'project'
          GROUP BY f.entity_id
        ) dl ON p.id = dl.entity_id
        ORDER BY p.created_at DESC
      `);
      
      await pool.end();
      
      const projects = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        downloadCount: parseInt(row.download_count) || 0,
        totalDataDownloaded: parseInt(row.total_data_downloaded) || 0,
        uniqueDownloaders: parseInt(row.unique_downloaders) || 0,
        filesCount: parseInt(row.files_count) || 0,
        episodesCount: parseInt(row.episodes_count) || 0,
        scriptsCount: parseInt(row.script_count) || 0,
        lastDownload: row.last_download
      }));
      
      console.log(`[ANALYTICS] Found ${projects.length} projects with stats`);
      res.json(projects);
    } catch (error) {
      console.error('Project analytics error:', error);
      res.json([]);
    }
  });

  // Get episode analytics
  app.get("/api/analytics/episodes", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT e.*, p.name as project_name
        FROM episodes e
        LEFT JOIN projects p ON e.project_id = p.id
        ORDER BY e.created_at DESC
      `);
      
      await pool.end();
      
      const episodes = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        episodeNumber: row.episode_number,
        projectId: row.project_id,
        projectName: row.project_name,
        createdAt: row.created_at
      }));
      
      console.log(`[ANALYTICS] Found ${episodes.length} episodes`);
      res.json(episodes);
    } catch (error) {
      console.error('Episode analytics error:', error);
      res.json([]);
    }
  });

  // Get script analytics
  app.get("/api/analytics/scripts", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT s.*, p.name as project_name
        FROM scripts s
        LEFT JOIN projects p ON s.project_id = p.id
        ORDER BY s.created_at DESC
      `);
      
      await pool.end();
      
      const scripts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        projectId: row.project_id,
        projectName: row.project_name,
        status: row.status || 'Draft',
        createdAt: row.created_at
      }));
      
      console.log(`[ANALYTICS] Found ${scripts.length} scripts`);
      res.json(scripts);
    } catch (error) {
      console.error('Script analytics error:', error);
      res.json([]);
    }
  });

  // Get user analytics
  app.get("/api/analytics/users", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT 
          u.*,
          COALESCE(dl.download_count, 0) as download_count,
          dl.last_download
        FROM users u
        LEFT JOIN (
          SELECT 
            user_id,
            COUNT(*) as download_count,
            MAX(downloaded_at) as last_download
          FROM download_logs
          GROUP BY user_id
        ) dl ON u.id = dl.user_id
        ORDER BY u.created_at DESC
      `);
      
      await pool.end();
      
      const users = result.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        downloadCount: parseInt(row.download_count) || 0,
        lastDownload: row.last_download
      }));
      
      console.log(`[ANALYTICS] Found ${users.length} users`);
      res.json(users);
    } catch (error) {
      console.error('User analytics error:', error);
      res.json([]);
    }
  });

  // Get file analytics
  app.get("/api/analytics/files", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT 
          f.*,
          COALESCE(dl.download_count, 0) as download_count,
          COALESCE(dl.total_downloaded, 0) as total_downloaded,
          dl.last_download
        FROM files f
        LEFT JOIN (
          SELECT 
            file_id,
            COUNT(*) as download_count,
            SUM(download_size) as total_downloaded,
            MAX(downloaded_at) as last_download
          FROM download_logs
          GROUP BY file_id
        ) dl ON f.id = dl.file_id
        ORDER BY dl.download_count DESC NULLS LAST, f.uploaded_at DESC
      `);
      
      await pool.end();
      
      const files = result.rows.map(row => ({
        id: row.id,
        filename: row.filename,
        originalName: row.original_name,
        entityType: row.entity_type,
        entityId: row.entity_id,
        uploadedAt: row.uploaded_at,
        downloadCount: parseInt(row.download_count) || 0,
        totalDownloaded: parseInt(row.total_downloaded) || 0,
        lastDownload: row.last_download
      }));
      
      console.log(`[ANALYTICS] Found ${files.length} files with download stats`);
      res.json(files);
    } catch (error) {
      console.error('File analytics error:', error);
      res.json([]);
    }
  });

  // Get download overview
  app.get("/api/analytics/downloads/overview", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      // Calculate date range
      let days = 7;
      switch (timeframe) {
        case '24h': days = 1; break;
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        default: days = 7;
      }
      
      const pool = createConnection();
      if (!pool) {
        return res.json({
          timeframe,
          totalDownloads: 0,
          uniqueDownloaders: 0,
          totalDataDownloaded: 0,
          popularFiles: [],
          downloadsByDay: [],
          downloadsByType: [],
          downloadsByHour: []
        });
      }
      
      // Get overview stats
      const overviewResult = await pool.query(`
        SELECT 
          COUNT(*) as total_downloads,
          COUNT(DISTINCT user_id) as unique_downloaders,
          COALESCE(SUM(download_size), 0) as total_data_downloaded
        FROM download_logs
        WHERE downloaded_at >= NOW() - INTERVAL '${days} days'
      `);
      
      const overview = overviewResult.rows[0];
      
      await pool.end();
      
      const response = {
        timeframe,
        totalDownloads: parseInt(overview.total_downloads) || 0,
        uniqueDownloaders: parseInt(overview.unique_downloaders) || 0,
        totalDataDownloaded: parseInt(overview.total_data_downloaded) || 0,
        popularFiles: [],
        downloadsByDay: [],
        downloadsByType: [],
        downloadsByHour: []
      };
      
      console.log(`[ANALYTICS] Download overview: ${response.totalDownloads} downloads, ${response.uniqueDownloaders} users`);
      res.json(response);
    } catch (error) {
      console.error('Download overview error:', error);
      res.json({
        timeframe: req.query.timeframe || '7d',
        totalDownloads: 0,
        uniqueDownloaders: 0,
        totalDataDownloaded: 0,
        popularFiles: [],
        downloadsByDay: [],
        downloadsByType: [],
        downloadsByHour: []
      });
    }
  });

  // Get download logs
  app.get("/api/analytics/downloads/logs", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      let days = 7;
      switch (timeframe) {
        case '24h': days = 1; break;
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        default: days = 7;
      }
      
      const pool = createConnection();
      if (!pool) {
        return res.json({ logs: [] });
      }
      
      const result = await pool.query(`
        SELECT 
          dl.*,
          f.filename,
          f.original_name,
          u.email as user_email,
          u.name as user_name,
          u.role as user_role
        FROM download_logs dl
        LEFT JOIN files f ON dl.file_id = f.id
        LEFT JOIN users u ON dl.user_id = u.id
        WHERE dl.downloaded_at >= NOW() - INTERVAL '${days} days'
        ORDER BY dl.downloaded_at DESC
        LIMIT 100
      `);
      
      await pool.end();
      
      const logs = result.rows.map(row => ({
        id: row.id,
        fileId: row.file_id,
        filename: row.filename,
        originalName: row.original_name,
        userId: row.user_id,
        userEmail: row.user_email,
        userName: row.user_name,
        userRole: row.user_role,
        ipAddress: row.ip_address,
        downloadSize: parseInt(row.download_size) || 0,
        downloadDuration: parseInt(row.download_duration) || 0,
        downloadStatus: row.download_status,
        entityType: row.entity_type,
        entityId: row.entity_id,
        refererPage: row.referer_page,
        downloadedAt: row.downloaded_at
      }));
      
      console.log(`[ANALYTICS] Found ${logs.length} download logs`);
      res.json({ logs });
    } catch (error) {
      console.error('Download logs error:', error);
      res.json({ logs: [] });
    }
  });

  // Get user downloads
  app.get("/api/analytics/downloads/users", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      let days = 7;
      switch (timeframe) {
        case '24h': days = 1; break;
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        default: days = 7;
      }
      
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT 
          u.id as user_id,
          u.email as user_email,
          u.name as user_name,
          u.role as user_role,
          COUNT(dl.id) as download_count,
          COALESCE(SUM(dl.download_size), 0) as total_size,
          MAX(dl.downloaded_at) as last_download
        FROM users u
        INNER JOIN download_logs dl ON u.id = dl.user_id
        WHERE dl.downloaded_at >= NOW() - INTERVAL '${days} days'
        GROUP BY u.id, u.email, u.name, u.role
        ORDER BY download_count DESC
      `);
      
      await pool.end();
      
      const userDownloads = result.rows.map(row => ({
        userId: row.user_id,
        userEmail: row.user_email,
        userName: row.user_name,
        userRole: row.user_role,
        downloadCount: parseInt(row.download_count) || 0,
        totalSize: parseInt(row.total_size) || 0,
        lastDownload: row.last_download
      }));
      
      console.log(`[ANALYTICS] Found ${userDownloads.length} users with downloads`);
      res.json(userDownloads);
    } catch (error) {
      console.error('User downloads error:', error);
      res.json([]);
    }
  });
}