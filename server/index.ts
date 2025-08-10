import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
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

    // Import route modules
    const { registerRoutes } = await import("./routes");
    const { registerOptimizedDownloadRoutes } = await import("./routes-download-optimized");
    const { registerOnboardingRoutes } = await import("./routes-onboarding-fixed");
    const { registerNotificationRoutes } = await import("./routes-notifications");
    const { registerAnalyticsRoutes } = await import("./routes-analytics");
    const { registerUserManagementRoutes } = await import("./routes-user-management");
    const { setupViteDevServer } = await import("./vite");

    // Register all routes
    registerOptimizedDownloadRoutes(app);
    registerOnboardingRoutes(app);
    registerNotificationRoutes(app);
    registerUserManagementRoutes(app);
    await registerRoutes(app);

    // Register analytics routes
    registerAnalyticsRoutes(app);


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
    const viteDevServer = await setupViteDevServer(app);
    const server = viteDevServer.listen(); // Ensure server is assigned from viteDevServer

    // IMPORTANT: Vite's dev server needs to be the one listening
    // so we don't call app.listen() here.
    // We will return this server instance from the registerRoutes function.
    // The main server instance needs to be returned so we can listen on it.
    return server; // Return the server instance from viteDevServer
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    // The server instance from viteDevServer should be used if in development
    // Otherwise, create a new server instance.
    const serverInstance = app.get("env") === "development"
        ? await setupViteDevServer(app).then(vite => vite.listen())
        : await import("http").then(({ createServer }) => createServer(app));


    serverInstance.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();