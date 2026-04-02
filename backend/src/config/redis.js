const Redis = require('ioredis');
require('dotenv').config();

// Check if Redis should be enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let redis;

if (REDIS_ENABLED) {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });
} else {
  console.log('⚠️  Redis is disabled. Using in-memory storage (not recommended for production)');

  // In-memory store with TTL support
  const memStore = new Map();

  redis = {
    setex: async (key, seconds, value) => {
      memStore.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
      return 'OK';
    },
    get: async (key) => {
      const entry = memStore.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
      return entry.value;
    },
    del: async (key) => { memStore.delete(key); return 1; },
    exists: async (key) => {
      const entry = memStore.get(key);
      if (!entry) return 0;
      if (Date.now() > entry.expiresAt) { memStore.delete(key); return 0; }
      return 1;
    },
    incr: async (key) => {
      const entry = memStore.get(key);
      const current = entry ? parseInt(JSON.parse(entry.value) || 0) : 0;
      const next = current + 1;
      memStore.set(key, { value: JSON.stringify(next), expiresAt: entry?.expiresAt || Date.now() + 3600000 });
      return next;
    },
    expire: async (key, seconds) => {
      const entry = memStore.get(key);
      if (entry) { entry.expiresAt = Date.now() + seconds * 1000; return 1; }
      return 0;
    },
    publish: async () => 1,
  };
}

// Helper functions for common Redis operations
const redisHelpers = {
  // Set with expiration
  setEx: async (key, value, expirationInSeconds = 3600) => {
    return await redis.setex(key, expirationInSeconds, JSON.stringify(value));
  },

  // Get and parse JSON
  get: async (key) => {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Delete key
  del: async (key) => {
    return await redis.del(key);
  },

  // Check if key exists
  exists: async (key) => {
    return await redis.exists(key);
  },

  // Increment counter
  incr: async (key) => {
    return await redis.incr(key);
  },

  // Set expiration on existing key
  expire: async (key, seconds) => {
    return await redis.expire(key, seconds);
  },

  // Publish message to channel
  publish: async (channel, message) => {
    return await redis.publish(channel, JSON.stringify(message));
  },
};

module.exports = { redis, ...redisHelpers };
