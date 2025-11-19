// backend/config/queue.js
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Create queues
export const embeddingQueue = new Queue('embedding-queue', { connection });

console.log('✅ Job Queues initialized');