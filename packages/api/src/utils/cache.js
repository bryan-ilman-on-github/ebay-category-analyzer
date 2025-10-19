import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple file-based cache for eBay API responses
 * Reduces API calls and improves performance
 * Automatically refreshes based on CACHE_DURATION setting
 */

export class CacheManager {
  constructor(cacheDir = null) {
    this.cacheDir = cacheDir || path.join(__dirname, '../../data');
    this.cacheDuration = parseInt(process.env.CACHE_DURATION || 2) * 60 * 60 * 1000; // hours to ms

    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  get(key) {
    const filePath = this.getCacheFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const cached = JSON.parse(fileContent);

      // Check if cache is still valid
      const age = Date.now() - cached.timestamp;
      if (age > this.cacheDuration) {
        // Cache expired
        this.delete(key);
        return null;
      }

      return cached.data;

    } catch (error) {
      console.error('Error reading cache:', error.message);
      this.delete(key); // Delete corrupted cache
      return null;
    }
  }

  /**
   * Store data in cache with timestamp
   */
  set(key, data) {
    const filePath = this.getCacheFilePath(key);

    const cached = {
      key,
      timestamp: Date.now(),
      data,
      expiresAt: new Date(Date.now() + this.cacheDuration).toISOString(),
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(cached, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing cache:', error.message);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  delete(key) {
    const filePath = this.getCacheFilePath(key);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (error) {
        console.error('Error deleting cache:', error.message);
        return false;
      }
    }

    return false;
  }

  /**
   * Clear all cache files
   */
  clearAll() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let cleared = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
          cleared++;
        }
      }

      return cleared;
    } catch (error) {
      console.error('Error clearing cache:', error.message);
      return 0;
    }
  }

  /**
   * Get cache age in hours
   */
  getCacheAge(key) {
    const filePath = this.getCacheFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const cached = JSON.parse(fileContent);
      const ageMs = Date.now() - cached.timestamp;
      return ageMs / (1000 * 60 * 60); // Convert to hours
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Generate cache file path from key
   */
  getCacheFilePath(key) {
    const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
    return path.join(this.cacheDir, `${sanitizedKey}.json`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const cacheFiles = files.filter(f => f.endsWith('.json'));

      const stats = {
        totalFiles: cacheFiles.length,
        totalSize: 0,
        oldestCache: null,
        newestCache: null,
        files: [],
      };

      for (const file of cacheFiles) {
        const filePath = path.join(this.cacheDir, file);
        const stat = fs.statSync(filePath);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        stats.totalSize += stat.size;

        const cacheInfo = {
          key: content.key,
          age: Date.now() - content.timestamp,
          expiresAt: content.expiresAt,
          size: stat.size,
        };

        stats.files.push(cacheInfo);

        if (!stats.oldestCache || cacheInfo.age > stats.oldestCache.age) {
          stats.oldestCache = cacheInfo;
        }
        if (!stats.newestCache || cacheInfo.age < stats.newestCache.age) {
          stats.newestCache = cacheInfo;
        }
      }

      return stats;

    } catch (error) {
      console.error('Error getting cache stats:', error.message);
      return null;
    }
  }
}

export default CacheManager;
