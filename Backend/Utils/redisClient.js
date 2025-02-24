import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379", // Fallback to localhost if env variable is missing
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));

redisClient.on('connect', () => console.log("✅ Redis connected successfully!"));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("❌ Error connecting to Redis:", err);
  }
})();




export default redisClient;
