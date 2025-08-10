import { Express } from 'express';
import { Pool } from 'pg';

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

export function registerThemeRoutes(app: Express) {
  // Get all themes
  app.get("/api/themes", async (req, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query('SELECT * FROM themes WHERE is_active = true ORDER BY name');
      await pool.end();
      
      const themes = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        colorHex: row.color_hex,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      console.log(`[THEMES] Found ${themes.length} themes`);
      res.json(themes);
    } catch (error) {
      console.error('Theme fetch error:', error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  // Get all projects with themes
  app.get("/api/projects", async (req, res) => {
    try {
      const pool = createConnection();
      if (!pool) {
        return res.json([]);
      }
      
      const result = await pool.query(`
        SELECT p.*, t.name as theme_name, t.color_hex as theme_color 
        FROM projects p 
        LEFT JOIN themes t ON p.theme_id = t.id 
        WHERE p.is_active = true 
        ORDER BY p.name
      `);
      await pool.end();
      
      const projects = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        themeId: row.theme_id,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Include theme info for easy access
        themeName: row.theme_name,
        themeColor: row.theme_color
      }));
      
      console.log(`[PROJECTS] Found ${projects.length} projects`);
      res.json(projects);
    } catch (error) {
      console.error('Projects fetch error:', error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  
  console.log("✅ Simple theme and project routes registered");
}