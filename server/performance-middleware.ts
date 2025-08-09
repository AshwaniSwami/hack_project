import { Request, Response, NextFunction } from 'express';

// Simple memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

function getCached(key: string): any | null {
  const entry: CacheEntry | undefined = cache.get(key);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key);
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function cacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const cached = getCached(cacheKey);

    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json;
    res.json = function(body: any) {
      // Cache successful responses
      if (res.statusCode === 200 && body) {
        setCache(cacheKey, body);
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