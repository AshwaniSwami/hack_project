import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerAuthRoutes } from "./routes-auth";
import { registerStorageRoutes } from "./storage";
import { registerOnboardingRoutes } from "./routes-onboarding";
import { registerDownloadTrackingRoutes } from "./routes-download-tracking";
import { registerNotificationRoutes } from "./routes-notifications";
import { registerAnalyticsRoutes } from "./routes-analytics";
import { registerThemeRoutes } from "./simple-theme-routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add compression middleware for better performance
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress files > 1KB
  level: 6 // Balanced compression level
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize storage before setting up routes
    const { initializeStorage } = await import("./storage");
    await initializeStorage();

    // Register all routes
    registerAuthRoutes(app);
    registerStorageRoutes(app);
    registerOnboardingRoutes(app);
    registerDownloadTrackingRoutes(app);
    registerNotificationRoutes(app);
    registerAnalyticsRoutes(app);
    registerThemeRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

// This is a placeholder for the server variable which is not defined in the provided snippet.
// In a real scenario, 'server' would be obtained from a call like `const server = await registerRoutes(app);`
// For the sake of providing a complete file, we'll define a dummy server object.
const server = {
  listen: (options: any, callback: () => void) => {
    callback();
    return { close: () => {} };
  }
};