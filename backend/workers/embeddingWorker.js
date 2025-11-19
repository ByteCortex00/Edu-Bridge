// backend/workers/embeddingWorker.js
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import JobPosting from '../models/jobPostingModel.js';
import Curriculum from '../models/curriculumModel.js';
import mlService from '../services/mlService.js';
import { mlConfig } from '../config/mlConfig.js';

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const embeddingWorker = new Worker(
  'embedding-queue',
  async (job) => {
    console.log(`⚙️ Processing job ${job.id}: ${job.name}`);

    // Initialize model if needed (lazy load in worker process)
    if (!mlService.isModelReady()) {
      await mlService.initModel();
    }

    try {
      if (job.name === 'generate-job-embedding') {
        const { jobId } = job.data;
        const jobDoc = await JobPosting.findById(jobId);

        if (!jobDoc) throw new Error('Job not found');

        const weightedTexts = jobDoc.getTextForEmbedding();
        const embedding = await mlService.generateWeightedEmbedding(weightedTexts);

        jobDoc.embedding = embedding;
        jobDoc.embeddingGenerated = new Date();
        jobDoc.embeddingVersion = mlConfig.model.version;
        jobDoc.embeddingError = null;
        
        await jobDoc.save();
        console.log(`✅ Generated embedding for Job: ${jobDoc.title}`);
      } 
      
      else if (job.name === 'generate-curriculum-embedding') {
        const { curriculumId } = job.data;
        const curriculum = await Curriculum.findById(curriculumId).populate('courses');

        if (!curriculum) throw new Error('Curriculum not found');

        const weightedTexts = await curriculum.getTextForEmbedding();
        const embedding = await mlService.generateWeightedEmbedding(weightedTexts);

        curriculum.embedding = embedding;
        curriculum.embeddingGenerated = new Date();
        curriculum.embeddingVersion = mlConfig.model.version;
        curriculum.embeddingError = null;

        await curriculum.save();
        console.log(`✅ Generated embedding for Curriculum: ${curriculum.programName}`);
      }
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      throw error; // BullMQ will handle retries
    }
  },
  { connection }
);

console.log('👷 Embedding Worker started');