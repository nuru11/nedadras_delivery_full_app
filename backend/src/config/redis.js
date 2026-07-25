const { createClient } = require("redis");
const env = require("./env");

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    if (!env.redisUrl) {
      throw new Error("REDIS_URL is not configured");
    }

    redisClient = createClient({ url: env.redisUrl });

    redisClient.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Redis error:", err);
    });
  }

  return redisClient;
}

async function ensureRedisConnected() {
  const client = getRedisClient();
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

module.exports = { getRedisClient, ensureRedisConnected };

