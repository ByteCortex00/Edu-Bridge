// backend/utils/regenerateEmbeddings.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import Curriculum from '../models/curriculumModel.js';
import JobPosting from '../models/jobPostingModel.js';
import mlService from '../services/mlService.js';
import { mlConfig } from '../config/mlConfig.js';

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function regenerateEmbeddings() {
  try {
    console.log('🔄 Starting embedding regeneration...');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Initialize ML service
    await mlService.initModel();
    console.log('✅ ML service initialized');

    // Regenerate curriculum embeddings
    console.log('\n📚 === REGENERATING CURRICULUM EMBEDDINGS ===');
    const curricula = await Curriculum.find({
      embedding: { $exists: true, $ne: null }
    }).select('_id programName embedding embeddingVersion');

    console.log(`📚 Found ${curricula.length} curricula with embeddings`);

    let curriculumRegenerated = 0;
    let curriculumSkipped = 0;

    for (const curriculum of curricula) {
      console.log(`\n🔍 Processing curriculum: ${curriculum.programName || 'Unknown'} (${curriculum._id})`);

      // Skip if programName is null
      if (!curriculum.programName) {
        console.log(`  ⚠️  Skipping curriculum with null programName`);
        curriculumSkipped++;
        continue;
      }

      // Check if regeneration is needed
      const needsRegeneration =
        !curriculum.embedding ||
        curriculum.embedding.length === 0 ||
        curriculum.embeddingVersion !== mlConfig.model.version ||
        curriculum.embedding.length !== mlConfig.model.embeddingDimensions;

      if (!needsRegeneration) {
        console.log(`  ✅ Embedding is up to date (${curriculum.embedding.length} dimensions, version: ${curriculum.embeddingVersion})`);
        curriculumSkipped++;
        continue;
      }

      console.log(`  🔄 Regenerating embedding (current: ${curriculum.embedding?.length || 0} dims, version: ${curriculum.embeddingVersion})`);

      try {
        // Generate new embedding
        const weightedTexts = await curriculum.getTextForEmbedding();
        const newEmbedding = await mlService.generateWeightedEmbedding(weightedTexts);

        // Update curriculum
        curriculum.embedding = newEmbedding;
        curriculum.embeddingGenerated = new Date();
        curriculum.embeddingVersion = mlConfig.model.version;
        await curriculum.save();

        console.log(`  ✅ Regenerated embedding (${newEmbedding.length} dimensions)`);
        curriculumRegenerated++;
      } catch (error) {
        console.error(`  ❌ Failed to regenerate embedding for ${curriculum.programName}:`, error.message);
      }
    }

    // Regenerate job embeddings
    console.log('\n💼 === REGENERATING JOB EMBEDDINGS ===');
    const jobs = await JobPosting.find({
      embedding: { $exists: true, $ne: null }
    }).select('_id title embedding embeddingVersion');

    console.log(`💼 Found ${jobs.length} jobs with embeddings`);

    let jobRegenerated = 0;
    let jobSkipped = 0;

    for (const job of jobs) {
      console.log(`\n🔍 Processing job: ${job.title} (${job._id})`);

      // Check if regeneration is needed
      const needsRegeneration =
        !job.embedding ||
        job.embedding.length === 0 ||
        job.embeddingVersion !== mlConfig.model.version ||
        job.embedding.length !== mlConfig.model.embeddingDimensions;

      if (!needsRegeneration) {
        console.log(`  ✅ Embedding is up to date (${job.embedding.length} dimensions, version: ${job.embeddingVersion})`);
        jobSkipped++;
        continue;
      }

      console.log(`  🔄 Regenerating embedding (current: ${job.embedding?.length || 0} dims, version: ${job.embeddingVersion})`);

      try {
        // Generate new embedding
        const weightedTexts = job.getTextForEmbedding();
        const newEmbedding = await mlService.generateWeightedEmbedding(weightedTexts);

        // Update job
        job.embedding = newEmbedding;
        job.embeddingGenerated = new Date();
        job.embeddingVersion = mlConfig.model.version;
        await job.save();

        console.log(`  ✅ Regenerated embedding (${newEmbedding.length} dimensions)`);
        jobRegenerated++;
      } catch (error) {
        console.error(`  ❌ Failed to regenerate embedding for ${job.title}:`, error.message);
      }
    }

    console.log(`\n🎉 Embedding regeneration complete!`);
    console.log(`📚 Curricula - Regenerated: ${curriculumRegenerated}, Skipped: ${curriculumSkipped}, Total: ${curricula.length}`);
    console.log(`💼 Jobs - Regenerated: ${jobRegenerated}, Skipped: ${jobSkipped}, Total: ${jobs.length}`);

    process.exit(0);
  } catch (error) {
    console.error('💥 Embedding regeneration failed:', error);
    process.exit(1);
  }
}

// Run the script
regenerateEmbeddings();