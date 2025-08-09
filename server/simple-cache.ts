// Simple, production-safe cache implementation
export class SimpleCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private ttl: number;
  private maxSize: number;

  constructor(ttlMs: number = 5 * 60 * 1000, maxSize: number = 100) {
    this.cache = new Map();
    this.ttl = ttlMs;
    this.maxSize = maxSize;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const responseCache = new SimpleCache(5 * 60 * 1000, 100); // 5 minutes, max 100 items
export const fileCache = new SimpleCache(10 * 60 * 1000, 50); // 10 minutes, max 50 files