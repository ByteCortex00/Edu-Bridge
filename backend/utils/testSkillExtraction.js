// backend/utils/testSkillsExtraction.js
import JobPosting from '../models/jobPostingModel.js';
import skillsExtractor from '../services/skillExtractor.js';
import { connectDB } from '../config/db.js';

// Ensure DB connection is established before running tests
await connectDB();

const testSkillExtraction = async () => {
  try {
    // Get the job from database
    const job = await JobPosting.findById('68f7d3def75b32d90f312734');
    
    if (!job) {
      console.log('❌ Job not found');
      return;
    }

    console.log('🔍 Original Job:');
    console.log(`Title: ${job.title}`);
    console.log(`Description: ${job.description.substring(0, 200)}...`);
    console.log(`Current Skills: ${job.requiredSkills.length}`);

    // Extract skills from description
    const extractedSkills = skillsExtractor.extractSkills(job.description);
    
    console.log('\n✅ Extracted Skills:');
    extractedSkills.forEach(skill => {
      console.log(`- ${skill.name} (${skill.category}, ${skill.importance})`);
    });

    // Update job with extracted skills
    job.requiredSkills = extractedSkills;
    await job.save();

    console.log(`\n📊 Updated job with ${extractedSkills.length} skills`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testSkillExtraction().then(() => {
  // Graceful exit when done
  process.exit(0);
}).catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});