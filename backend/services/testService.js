// backend/services/testDataPipeline.js
import skillsExtractor from './skillExtractor.js';
import gapAnalysisService from './gapAnalysis.js';
import { connectDB } from '../config/db.js'; // Import connectDB and call it before tests
import Curriculum from '../models/curriculumModel.js';
import Course from '../models/coursesModel.js';
import JobPosting from '../models/jobPostingModel.js';
import Institution from '../models/institutionModel.js';
import SkillsGap from '../models/skillGapModels.js';

class DataPipelineTester {
  constructor() {
    this.testResults = [];
    this.testData = {
      institutionId: null,
      curriculumId: null,
      courseIds: [],
      jobIds: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Data Pipeline Tests...\n');
    
    try {
      // Test 1: Skills Extractor
      await this.testSkillsExtractor();
      
      // Test 2: Data Models & Relationships
      await this.testDataModels();
      
      // Test 3: Gap Analysis Service
      await this.testGapAnalysisService();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanupTestData();
    }
  }

  async testSkillsExtractor() {
    console.log('🧪 Testing Skills Extractor...');
    
    const tests = [
      {
        name: 'Basic skill extraction',
        text: 'We need a JavaScript developer with React and Node.js experience. Python is a plus.',
        expectedSkills: ['javascript', 'react', 'node.js', 'python']
      },
      {
        name: 'Skill frequency counting',
        text: 'JavaScript is required. We use JavaScript for frontend and JavaScript for backend.',
        expectedSkill: 'javascript',
        minFrequency: 3
      },
      {
        name: 'Importance detection',
        text: 'Must have Python experience. AWS would be nice to have.',
        expectedRequired: ['python'],
        expectedPreferred: ['aws']
      }
    ];

    for (const test of tests) {
      try {
        const skills = skillsExtractor.extractSkills(test.text);
        
        if (test.expectedSkills) {
          const foundSkills = skills.map(s => s.name);
          const missingSkills = test.expectedSkills.filter(skill => 
            !foundSkills.includes(skill)
          );
          
          if (missingSkills.length === 0) {
            this.recordResult(test.name, 'PASSED', `Found all expected skills: ${test.expectedSkills.join(', ')}`);
          } else {
            this.recordResult(test.name, 'FAILED', `Missing skills: ${missingSkills.join(', ')}`);
          }
        }
        
        if (test.expectedSkill && test.minFrequency) {
          const skill = skills.find(s => s.name === test.expectedSkill);
          if (skill && skill.frequency >= test.minFrequency) {
            this.recordResult(test.name, 'PASSED', `Skill frequency: ${skill.frequency} (min: ${test.minFrequency})`);
          } else {
            this.recordResult(test.name, 'FAILED', `Frequency too low: ${skill?.frequency || 0}`);
          }
        }
        
      } catch (error) {
        this.recordResult(test.name, 'ERROR', error.message);
      }
    }
  }

  async testDataModels() {
    console.log('\n🗄️ Testing Data Models & Relationships...');
    
    try {
      // Create test institution
      const institution = await Institution.create({
        name: 'Test University',
        type: 'university',
        location: {
          country: 'Kenya',
          region: 'Nairobi',
          city: 'Nairobi'
        },
        contactEmail: 'test@university.edu',
        description: 'Test institution for data pipeline testing'
      });
      
      this.testData.institutionId = institution._id;
      this.recordResult('Institution Creation', 'PASSED', `Created institution: ${institution.name}`);

      // Create test curriculum
      const curriculum = await Curriculum.create({
        institutionId: institution._id,
        programName: 'Test Computer Science Program',
        degree: 'bachelor',
        department: 'Computer Science',
        duration: 48,
        targetIndustries: ['IT', 'Software Development'],
        description: 'Test curriculum for data pipeline testing'
      });
      
      this.testData.curriculumId = curriculum._id;
      this.recordResult('Curriculum Creation', 'PASSED', `Created curriculum: ${curriculum.programName}`);

      // Create test courses with skills
      const coursesData = [
        {
          curriculumId: curriculum._id,
          courseCode: 'CS101',
          courseName: 'Introduction to Programming',
          credits: 3,
          description: 'Basic programming concepts',
          skills: [
            { name: 'javascript', category: 'programming', proficiencyLevel: 'beginner' },
            { name: 'python', category: 'programming', proficiencyLevel: 'beginner' }
          ]
        },
        {
          curriculumId: curriculum._id,
          courseCode: 'CS201',
          courseName: 'Web Development',
          credits: 4,
          description: 'Web development fundamentals',
          skills: [
            { name: 'html', category: 'webDevelopment', proficiencyLevel: 'intermediate' },
            { name: 'css', category: 'webDevelopment', proficiencyLevel: 'intermediate' },
            { name: 'javascript', category: 'programming', proficiencyLevel: 'intermediate' }
          ]
        }
      ];

      for (const courseData of coursesData) {
        const course = await Course.create(courseData);
        this.testData.courseIds.push(course._id);
        
        // Add course to curriculum
        curriculum.courses.push(course._id);
      }
      
      await curriculum.save();
      this.recordResult('Course Creation', 'PASSED', `Created ${coursesData.length} courses with skills`);

      // Create test job postings
      const jobsData = [
        {
          adzunaId: `test-job-${Date.now()}-1`,
          title: 'Senior JavaScript Developer',
          company: 'Tech Company A',
          location: {
            country: 'Kenya',
            region: 'Nairobi',
            city: 'Nairobi'
          },
          description: 'We need a senior developer with strong JavaScript and React skills. Node.js experience is required. Python would be a plus. Must have excellent communication skills.',
          salaryMin: 50000,
          salaryMax: 80000,
          category: 'IT Jobs',
          contractType: 'permanent',
          requiredSkills: [
            { name: 'javascript', category: 'programming', importance: 'required' },
            { name: 'react', category: 'webDevelopment', importance: 'required' },
            { name: 'node.js', category: 'webDevelopment', importance: 'required' },
            { name: 'python', category: 'programming', importance: 'preferred' },
            { name: 'communication', category: 'softSkills', importance: 'required' }
          ],
          postedDate: new Date(),
          sourceUrl: 'http://example.com/job1'
        },
        {
          adzunaId: `test-job-${Date.now()}-2`,
          title: 'Python Data Scientist',
          company: 'Data Corp',
          location: {
            country: 'Kenya',
            region: 'Nairobi',
            city: 'Nairobi'
          },
          description: 'Looking for a data scientist with Python, machine learning, and data analysis skills. Pandas and NumPy experience is essential. AWS knowledge is preferred.',
          salaryMin: 60000,
          salaryMax: 90000,
          category: 'Data Science Jobs',
          contractType: 'permanent',
          requiredSkills: [
            { name: 'python', category: 'programming', importance: 'required' },
            { name: 'machine learning', category: 'dataScience', importance: 'required' },
            { name: 'data analysis', category: 'dataScience', importance: 'required' },
            { name: 'pandas', category: 'dataScience', importance: 'required' },
            { name: 'numpy', category: 'dataScience', importance: 'required' },
            { name: 'aws', category: 'cloud', importance: 'preferred' }
          ],
          postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          sourceUrl: 'http://example.com/job2'
        }
      ];

      for (const jobData of jobsData) {
        const job = await JobPosting.create(jobData);
        this.testData.jobIds.push(job._id);
      }
      
      this.recordResult('Job Posting Creation', 'PASSED', `Created ${jobsData.length} job postings`);

      // Test data relationships
      const populatedCurriculum = await Curriculum.findById(curriculum._id)
        .populate('courses')
        .populate('institutionId');
      
      if (populatedCurriculum.courses.length === 2) {
        this.recordResult('Data Relationships', 'PASSED', 'Curriculum properly linked with courses and institution');
      } else {
        this.recordResult('Data Relationships', 'FAILED', `Expected 2 courses, found ${populatedCurriculum.courses.length}`);
      }

    } catch (error) {
      this.recordResult('Data Models', 'ERROR', error.message);
    }
  }

  async testGapAnalysisService() {
    console.log('\n📊 Testing Gap Analysis Service...');
    
    if (!this.testData.curriculumId) {
      this.recordResult('Gap Analysis', 'SKIPPED', 'No curriculum available for testing');
      return;
    }
    
    try {
      // Test 1: Curriculum skills extraction
      const curriculum = await Curriculum.findById(this.testData.curriculumId).populate('courses');
      const curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);
      
      console.log('   Extracted curriculum skills:');
      curriculumSkills.forEach(skill => {
        console.log(`   - ${skill.name} (${skill.category}, ${skill.proficiencyLevel}, frequency: ${skill.frequency})`);
      });
      
      if (curriculumSkills.length >= 3) { // Should have javascript, python, html, css
        this.recordResult('Curriculum Skills Extraction', 'PASSED', `Extracted ${curriculumSkills.length} unique skills`);
      } else {
        this.recordResult('Curriculum Skills Extraction', 'FAILED', `Only extracted ${curriculumSkills.length} skills`);
      }

      // Test 2: Market skills extraction
      const jobs = await JobPosting.find({ _id: { $in: this.testData.jobIds } });
      const marketSkills = skillsExtractor.extractFromMultipleJobs(jobs);
      
      console.log('   Top market skills:');
      marketSkills.slice(0, 5).forEach(skill => {
        console.log(`   - ${skill.name} (${skill.category}, demand: ${skill.demandRate.toFixed(1)}%)`);
      });
      
      if (marketSkills.length > 0) {
        this.recordResult('Market Skills Extraction', 'PASSED', `Found ${marketSkills.length} market skills`);
      } else {
        this.recordResult('Market Skills Extraction', 'FAILED', 'No market skills extracted');
      }

      // Test 3: Full gap analysis
      const analysis = await gapAnalysisService.analyzeCurriculum(this.testData.curriculumId, {
        limit: 10,
        daysBack: 30
      });
      
      if (analysis.success) {
        this.recordResult('Full Gap Analysis', 'PASSED', 'Analysis completed successfully');
        
        console.log('\n   📈 Analysis Results:');
        console.log(`   - Overall Match Rate: ${analysis.data.metrics.overallMatchRate}%`);
        console.log(`   - Critical Gaps: ${analysis.data.metrics.criticalGaps.length}`);
        console.log(`   - Emerging Skills: ${analysis.data.metrics.emergingSkills.length}`);
        console.log(`   - Well-covered Skills: ${analysis.data.metrics.wellCoveredSkills.length}`);
        console.log(`   - Recommendations: ${analysis.data.recommendations.length}`);
        
        // Show some critical gaps
        if (analysis.data.metrics.criticalGaps.length > 0) {
          console.log('\n   🚨 Top Critical Gaps:');
          analysis.data.metrics.criticalGaps.slice(0, 3).forEach(gap => {
            console.log(`   - ${gap.skillName} (demand: ${gap.demandFrequency.toFixed(1)}%, severity: ${gap.gapSeverity})`);
          });
        }
        
        // Show some recommendations
        if (analysis.data.recommendations.length > 0) {
          console.log('\n   💡 Key Recommendations:');
          analysis.data.recommendations.slice(0, 3).forEach(rec => {
            console.log(`   - ${rec.description} (priority: ${rec.priority})`);
          });
        }
        
      } else {
        this.recordResult('Full Gap Analysis', 'FAILED', analysis.message);
      }

    } catch (error) {
      this.recordResult('Gap Analysis', 'ERROR', error.message);
    }
  }

  recordResult(testName, status, message) {
    const result = {
      testName,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const statusIcon = {
      'PASSED': '✅',
      'FAILED': '❌',
      'ERROR': '🚨',
      'SKIPPED': '⏭️'
    }[status] || '❓';
    
    console.log(`   ${statusIcon} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📈 TEST SUMMARY');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🚨 Errors: ${errors}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    
    if (failed > 0 || errors > 0) {
      console.log('\n🔍 Failed/Error Details:');
      this.testResults
        .filter(r => r.status === 'FAILED' || r.status === 'ERROR')
        .forEach(result => {
          console.log(`   ${result.testName}: ${result.message}`);
        });
    }
    
    console.log('\n' + '=' .repeat(50));
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up in reverse order to maintain referential integrity
      if (this.testData.jobIds.length > 0) {
        await JobPosting.deleteMany({ _id: { $in: this.testData.jobIds } });
      }
      
      if (this.testData.courseIds.length > 0) {
        await Course.deleteMany({ _id: { $in: this.testData.courseIds } });
      }
      
      if (this.testData.curriculumId) {
        await Curriculum.findByIdAndDelete(this.testData.curriculumId);
      }
      
      if (this.testData.institutionId) {
        await Institution.findByIdAndDelete(this.testData.institutionId);
      }
      
      // Clean up any test skills gap analyses
      await SkillsGap.deleteMany({ 
        'metrics.overallMatchRate': { $exists: true } 
      });
      
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.log('⚠️  Some test data could not be cleaned up:', error.message);
    }
  }
}


// Ensure DB is connected before running tests
await connectDB();

// Run the tests
const tester = new DataPipelineTester();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
console.log('Starting Data Pipeline Tests...\n');
tester.runAllTests().catch(console.error);