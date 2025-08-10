
import express from "express";
import { createServer } from "http";
import cors from "cors";
import session from "express-session";
import cookieParser from 'cookie-parser';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import route handlers
import { registerRoutes } from "./routes";
import { registerAnalyticsRoutes } from "./routes-analytics";
import { registerProjectAnalyticsRoutes } from "./routes-projects-analytics";
import { registerEpisodeAnalyticsRoutes } from "./routes-episodes-analytics";
import { registerScriptAnalyticsRoutes } from "./routes-script-analytics";
import { performanceMiddleware } from "./performance-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Trust proxy for proper IP detection
app.set('trust proxy', 1);

// Middleware setup
app.use(performanceMiddleware);
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Initialize storage
console.log("🔄 Initializing storage...");

// Check database connection
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not found - using fallback storage");
} else {
  console.log("✅ DATABASE_URL found - connecting to database");
}

// Register all routes
try {
  // Main routes
  registerRoutes(app);
  
  // Analytics routes
  registerAnalyticsRoutes(app);
  registerProjectAnalyticsRoutes(app);
  registerEpisodeAnalyticsRoutes(app);
  registerScriptAnalyticsRoutes(app);
  
  console.log("✅ All routes registered including analytics");
} catch (error) {
  console.error("❌ Error registering routes:", error);
}

// Serve static files from client dist
const clientDistPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDistPath));

// Handle client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      console.error("Error serving index.html:", err);
      res.status(404).send("Page not found");
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Analytics available at http://localhost:${PORT}/analytics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
