import { Request, Response, NextFunction } from 'express';
import { responseCache } from './simple-cache';

export function cacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const cached = responseCache.get(cacheKey);

    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json;
    res.json = function(body: any) {
      // Cache successful responses
      if (res.statusCode === 200 && body) {
        responseCache.set(cacheKey, body);
        console.log(`[CACHE SET] ${cacheKey}`);
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

export function compressionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(body: any) {
      // Add compression headers for large responses
      if (body && JSON.stringify(body).length > 1000) {
        res.setHeader('Content-Encoding', 'gzip');
      }
      return originalJson.call(this, body);
    };
    next();
  };
}

export function performanceHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add performance headers
    res.setHeader('X-Response-Time', Date.now().toString());
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    next();
  };
}

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Combine all performance middleware
  const startTime = Date.now();
  
  res.setHeader('X-Response-Time', startTime.toString());
  res.setHeader('Cache-Control', 'public, max-age=300');
  
  // Log response time when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}