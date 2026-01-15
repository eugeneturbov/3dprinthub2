const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('Redis max retry attempts reached');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('connect', () => {
  console.log('✅ Redis connected');
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

client.on('ready', () => {
  console.log('✅ Redis ready');
});

client.on('end', () => {
  console.log('❌ Redis connection ended');
});

process.on('SIGINT', () => {
  client.quit();
});

module.exports = client;
