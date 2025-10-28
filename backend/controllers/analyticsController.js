// backend/controllers/analyticsController.js
import SkillsGap from '../models/skillGapModels.js';
import Curriculum from '../models/curriculumModel.js';
import JobPosting from '../models/jobPostingModel.js';
import gapAnalysisService from '../services/gapAnalysis.js';
import skillsExtractor from '../services/skillExtractor.js';
import mlService from '../services/mlService.js'; 

/**
 * @desc    Run skills gap analysis for a curriculum
 * @route   POST /api/analytics/analyze/:curriculumId
 * @access  Private
 */
export const analyzeSkillsGap = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 100, daysBack = 90, targetIndustry } = req.body;

    console.log('🔍 === STARTING SKILLS GAP ANALYSIS DEBUG ===');
    console.log('📝 Parameters:', { curriculumId, jobLimit, daysBack, targetIndustry });

    // Validate curriculum exists
    const curriculum = await Curriculum.findById(curriculumId).populate('courses');
    if (!curriculum) {
      console.log('❌ Curriculum not found:', curriculumId);
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    console.log('✅ Curriculum found:', curriculum.programName);
    console.log('📚 Courses in curriculum:', curriculum.courses?.length || 0);
    
    // Debug: Show course names
    if (curriculum.courses && curriculum.courses.length > 0) {
      console.log('📖 Course Names:', curriculum.courses.map(course => course.courseName));
    } else {
      console.log('⚠️ No courses found in curriculum');
    }

    // Debug: Extract and show skills from curriculum
    let curriculumSkills = [];
    try {
      curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);
      console.log('🎯 Extracted Curriculum Skills:', curriculumSkills);
      console.log('📊 Total skills extracted:', curriculumSkills.length);
      
      // Show skill categories
      const skillCategories = [...new Set(curriculumSkills.map(skill => skill.category))];
      console.log('📋 Skill Categories found:', skillCategories);
    } catch (extractError) {
      console.log('❌ Error extracting curriculum skills:', extractError);
    }

    // Debug: Check job sampling - FIX THE FIELD NAME HERE
    const dateFilter = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };

    // FIXED: Use 'category' instead of 'industry'
    if (targetIndustry) {
      dateFilter.category = targetIndustry;
    }

    console.log('🔍 Date filter being used:', dateFilter);
    console.log('📅 Looking for jobs posted after:', dateFilter.postedDate.$gte);

    // First check total jobs without any filter
    const totalJobsInDB = await JobPosting.countDocuments({});
    console.log('📊 Total jobs in database:', totalJobsInDB);

    // Check what categories exist in DB
    const availableCategories = await JobPosting.distinct('category');
    console.log('🏷️ Available categories:', availableCategories);

    // Then check with date filter only
    const jobsInTimeframe = await JobPosting.countDocuments({
      postedDate: dateFilter.postedDate
    });
    console.log('📅 Jobs in timeframe (no category filter):', jobsInTimeframe);

    // Get a sample job to check date format
    const sampleJob = await JobPosting.findOne({}).select('postedDate category title');
    if (sampleJob) {
      console.log('📋 Sample job:', {
        title: sampleJob.title,
        category: sampleJob.category,
        postedDate: sampleJob.postedDate,
        postedDateType: typeof sampleJob.postedDate
      });
    }

    // Finally check with full filter
    const jobsWithFilter = await JobPosting.countDocuments(dateFilter);
    console.log('🎯 Jobs matching full filter:', jobsWithFilter);

    const jobSamples = await JobPosting.find(dateFilter)
      .limit(Math.min(5, jobLimit))
      .select('title company category description requiredSkills postedDate');  // Added description

    console.log('💼 Job sampling debug:');
    console.log('📈 Total jobs in timeframe:', jobsWithFilter);
    console.log('🔍 Sample job titles:', jobSamples.map(job => job.title));
    console.log('🏢 Sample companies:', [...new Set(jobSamples.map(job => job.company))]);
    console.log('🏭 Categories found:', [...new Set(jobSamples.map(job => job.category))]);

    // Debug: Analyze job skills
    console.log('\n🔍 === ANALYZING JOB SAMPLES ===');
    const jobSkills = [];
    jobSamples.forEach((job, index) => {
      console.log(`\n📄 Job ${index + 1}: ${job.title}`);
      console.log(`   Category: ${job.category}`);
      console.log(`   Has description: ${job.description ? 'Yes' : 'No'}`);
      console.log(`   Description length: ${job.description?.length || 0} chars`);
      console.log(`   Description preview: ${job.description?.substring(0, 100)}...`);
      console.log(`   Has requiredSkills field: ${job.requiredSkills ? 'Yes' : 'No'}`);
      console.log(`   Skills count in field: ${job.requiredSkills?.length || 0}`);
      
      if (job.requiredSkills && job.requiredSkills.length > 0) {
        console.log(`   Skills from field: ${job.requiredSkills.slice(0, 3).map(s => s.name).join(', ')}`);
        job.requiredSkills.forEach(skill => {
          jobSkills.push(skill.name);
        });
      }
    });

    const skillFrequency = jobSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Top skills in job market sample:',
      Object.entries(skillFrequency).length > 0
        ? Object.entries(skillFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => `${skill} (${count} jobs)`)
        : '⚠️ No skills found in requiredSkills field - skills will be extracted from descriptions'
    );

    console.log('🔍 === END DEBUGGING - STARTING ANALYSIS ===');

    // Run the actual analysis
    const analysis = await gapAnalysisService.analyzeCurriculum(curriculumId, {
      limit: jobLimit,
      daysBack: daysBack,
      targetIndustry: targetIndustry
    });

    if (!analysis.success) {
      console.log('❌ Analysis failed:', analysis.message);
      return res.status(400).json(analysis);
    }

    console.log('✅ Analysis completed successfully');
    console.log('📈 Final match rate:', analysis.data?.metrics?.overallMatchRate || 0);
    console.log('🎯 Critical gaps found:', analysis.data?.metrics?.criticalGaps?.length || 0);
    console.log('💡 Well-covered skills:', analysis.data?.metrics?.wellCoveredSkills?.length || 0);

    res.status(200).json(analysis);

  } catch (error) {
    console.error('💥 Analyze skills gap error:', error);
    console.error('🔧 Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error during skills gap analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * @desc    Debug skills extraction and job sampling
 * @route   GET /api/analytics/debug-analysis/:curriculumId
 * @access  Private
 */
export const debugAnalysisSetup = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 5, daysBack = 30, targetIndustry = "IT Jobs" } = req.query;

    console.log('🔍 [DEBUG] Starting analysis debug for:', curriculumId);

    // Get curriculum with courses
    const curriculum = await Curriculum.findById(curriculumId).populate('courses');
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Extract skills using the same method as the analysis
    const curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);

    // Get job samples - FIXED: Use 'category' instead of 'industry'
    const dateFilter = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };
    
    if (targetIndustry && targetIndustry !== 'all') {
      dateFilter.category = targetIndustry;  // FIXED
    }

    const jobSamples = await JobPosting.find(dateFilter)
      .limit(parseInt(jobLimit))
      .select('title company category requiredSkills postedDate salaryMin salaryMax');

    // Analyze job skills
    const allJobSkills = [];
    jobSamples.forEach(job => {
      if (job.requiredSkills) {
        job.requiredSkills.forEach(skill => {
          allJobSkills.push({
            name: skill.name,
            category: skill.category,
            importance: skill.importance,
            jobTitle: job.title
          });
        });
      }
    });

    const skillFrequency = allJobSkills.reduce((acc, skill) => {
      const key = skill.name.toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          categories: new Set(),
          jobs: new Set(),
          importance: {}
        };
      }
      acc[key].count++;
      acc[key].categories.add(skill.category);
      acc[key].jobs.add(skill.jobTitle);
      acc[key].importance[skill.importance] = (acc[key].importance[skill.importance] || 0) + 1;
      return acc;
    }, {});

    // Calculate matches
    const curriculumSkillNames = curriculumSkills.map(s => s.name.toLowerCase());
    const matchingSkills = Object.keys(skillFrequency).filter(skillName => 
      curriculumSkillNames.includes(skillName.toLowerCase())
    );

    res.status(200).json({
      success: true,
      debug: {
        curriculum: {
          id: curriculum._id,
          programName: curriculum.programName,
          department: curriculum.department,
          courseCount: curriculum.courses?.length || 0,
          courses: curriculum.courses?.map(c => ({
            name: c.courseName,
            code: c.courseCode,
            description: c.description?.substring(0, 100) + '...'
          })),
          extractedSkills: curriculumSkills,
          extractedSkillCount: curriculumSkills.length
        },
        jobMarket: {
          parameters: {
            jobLimit: parseInt(jobLimit),
            daysBack: parseInt(daysBack),
            targetIndustry
          },
          totalJobsInTimeframe: await JobPosting.countDocuments(dateFilter),
          samples: jobSamples.map(job => ({
            title: job.title,
            company: job.company,
            category: job.category,  // Changed from 'industry' to 'category'
            skillCount: job.requiredSkills?.length || 0,
            salary: job.salaryMin ? `${job.salaryMin} - ${job.salaryMax}` : 'Not specified'
          })),
          skills: Object.entries(skillFrequency)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, data]) => ({
              name,
              frequency: data.count,
              percentage: ((data.count / jobSamples.length) * 100).toFixed(1),
              categories: Array.from(data.categories),
              sampleJobs: Array.from(data.jobs).slice(0, 3),
              importance: data.importance
            }))
        },
        analysis: {
          curriculumSkillsCount: curriculumSkills.length,
          marketSkillsCount: Object.keys(skillFrequency).length,
          matchingSkillsCount: matchingSkills.length,
          potentialMatchRate: ((matchingSkills.length / Object.keys(skillFrequency).length) * 100).toFixed(1),
          matchingSkills: matchingSkills,
          missingSkills: Object.keys(skillFrequency)
            .filter(skill => !matchingSkills.includes(skill))
            .slice(0, 10)
        }
      }
    });

  } catch (error) {
    console.error('💥 Debug analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug analysis failed',
      error: error.message
    });
  }
};

// ... rest of the controller functions remain the same
/**
 * @desc    Get latest analysis for a curriculum
 * @route   GET /api/analytics/latest/:curriculumId
 * @access  Private
 */
export const getLatestAnalysis = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const analysis = await SkillsGap.findOne({ curriculumId })
      .sort({ analysisDate: -1 })
      .populate('curriculumId', 'programName department institutionId')
      .populate({
        path: 'curriculumId',
        populate: {
          path: 'institutionId',
          select: 'name'
        }
      });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this curriculum'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get latest analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analysis'
    });
  }
};

/**
 * @desc    Get skills gap trends over time
 * @route   GET /api/analytics/trends/:curriculumId
 * @access  Private
 */
export const getGapTrends = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const analyses = await SkillsGap.find({ curriculumId })
      .sort({ analysisDate: 1 })
      .select('analysisDate metrics.overallMatchRate jobSampleSize');

    if (analyses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No historical analysis data found'
      });
    }

    const trends = analyses.map(analysis => ({
      date: analysis.analysisDate,
      matchRate: analysis.metrics.overallMatchRate,
      jobSampleSize: analysis.jobSampleSize
    }));

    res.status(200).json({
      success: true,
      data: trends,
      summary: {
        totalAnalyses: analyses.length,
        currentMatchRate: analyses[analyses.length - 1].metrics.overallMatchRate,
        firstAnalysisDate: analyses[0].analysisDate
      }
    });
  } catch (error) {
    console.error('Get gap trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching gap trends'
    });
  }
};

/**
 * @desc    Get top in-demand skills from job market
 * @route   GET /api/analytics/top-skills
 * @access  Public
 */
export const getTopSkills = async (req, res) => {
  try {
    const { 
      category, 
      limit = 20, 
      daysBack = 90,
      minDemand = 0 
    } = req.query;

    // Build date filter
    const dateFilter = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };

    const matchStage = category 
      ? { ...dateFilter, 'requiredSkills.category': category }
      : dateFilter;

    const topSkills = await JobPosting.aggregate([
      { $match: matchStage },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          count: { $sum: 1 },
          category: { $first: '$requiredSkills.category' },
          importance: {
            $push: '$requiredSkills.importance'
          },
          avgSalary: {
            $avg: {
              $cond: [
                { $and: ['$salaryMin', '$salaryMax'] },
                { $divide: [{ $add: ['$salaryMin', '$salaryMax'] }, 2] },
                null
              ]
            }
          }
        }
      },
      { 
        $match: { 
          count: { $gte: parseInt(minDemand) } 
        } 
      },
      { 
        $addFields: {
          requiredCount: {
            $size: {
              $filter: {
                input: '$importance',
                as: 'imp',
                cond: { $eq: ['$$imp', 'required'] }
              }
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate total jobs for demand percentage
    const totalJobs = await JobPosting.countDocuments(dateFilter);

    const skillsWithDemand = topSkills.map(skill => ({
      name: skill._id,
      category: skill.category,
      jobCount: skill.count,
      demandPercentage: totalJobs > 0 ? (skill.count / totalJobs) * 100 : 0,
      requiredCount: skill.requiredCount,
      avgSalary: skill.avgSalary
    }));

    res.status(200).json({
      success: true,
      data: skillsWithDemand,
      metadata: {
        totalJobs,
        timePeriod: `${daysBack} days`,
        minDemand: parseInt(minDemand)
      }
    });
  } catch (error) {
    console.error('Get top skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top skills'
    });
  }
};

/**
 * @desc    Compare multiple curricula
 * @route   POST /api/analytics/compare
 * @access  Private
 */
export const comparePrograms = async (req, res) => {
  try {
    const { curriculumIds } = req.body;

    if (!Array.isArray(curriculumIds) || curriculumIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 curriculum IDs for comparison'
      });
    }

    // Get latest analysis for each curriculum
    const comparisons = await Promise.all(
      curriculumIds.map(async (id) => {
        const analysis = await SkillsGap.findOne({ curriculumId: id })
          .sort({ analysisDate: -1 })
          .populate('curriculumId', 'programName department institutionId')
          .populate({
            path: 'curriculumId',
            populate: {
              path: 'institutionId',
              select: 'name'
            }
          });

        if (!analysis) {
          // If no analysis exists, run one
          const newAnalysis = await gapAnalysisService.analyzeCurriculum(id);
          return newAnalysis.success ? newAnalysis.data : null;
        }

        return analysis;
      })
    );

    const validComparisons = comparisons.filter(c => c !== null);

    if (validComparisons.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Could not get sufficient data for comparison'
      });
    }

    // Generate comparison summary
    const comparisonSummary = {
      totalPrograms: validComparisons.length,
      avgMatchRate: validComparisons.reduce((sum, comp) => 
        sum + comp.metrics.overallMatchRate, 0) / validComparisons.length,
      highestMatchRate: Math.max(...validComparisons.map(c => c.metrics.overallMatchRate)),
      lowestMatchRate: Math.min(...validComparisons.map(c => c.metrics.overallMatchRate)),
      commonCriticalGaps: this.findCommonGaps(validComparisons)
    };

    res.status(200).json({
      success: true,
      data: {
        comparisons: validComparisons,
        summary: comparisonSummary
      }
    });
  } catch (error) {
    console.error('Compare programs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error comparing programs'
    });
  }
};

/**
 * @desc    Find common critical gaps across multiple analyses
 */
const findCommonGaps = (analyses) => {
  const gapCounts = new Map();
  
  analyses.forEach(analysis => {
    analysis.metrics.criticalGaps.forEach(gap => {
      const key = gap.skillName.toLowerCase();
      if (gapCounts.has(key)) {
        gapCounts.set(key, gapCounts.get(key) + 1);
      } else {
        gapCounts.set(key, 1);
      }
    });
  });

  return Array.from(gapCounts.entries())
    .map(([skill, count]) => ({
      skillName: skill,
      frequency: count,
      percentage: (count / analyses.length) * 100
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
};

/**
 * @desc    Get dashboard overview for institution
 * @route   GET /api/analytics/dashboard/:institutionId
 * @access  Private
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Get all curricula for institution
    const curricula = await Curriculum.find({ institutionId });
    
    if (curricula.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No curricula found for this institution'
      });
    }

    const curriculumIds = curricula.map(c => c._id);

    // Get latest analyses
    const analyses = await SkillsGap.find({
      curriculumId: { $in: curriculumIds }
    })
      .sort({ analysisDate: -1 })
      .limit(curricula.length)
      .populate('curriculumId', 'programName');

    // Calculate aggregate metrics
    const avgMatchRate = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.metrics.overallMatchRate, 0) / analyses.length 
      : 0;

    const totalCriticalGaps = analyses.reduce((sum, a) => 
      sum + a.metrics.criticalGaps.length, 0);

    // Get recent job market data
    const recentJobs = await JobPosting.countDocuments({
      postedDate: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });

    // Get top skills in demand
    const topSkills = await JobPosting.aggregate([
      { 
        $match: { 
          postedDate: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        } 
      },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          count: { $sum: 1 },
          category: { $first: '$requiredSkills.category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        institutionMetrics: {
          totalPrograms: curricula.length,
          analyzedPrograms: analyses.length,
          avgMatchRate: Math.round(avgMatchRate * 100) / 100,
          totalCriticalGaps,
          recentJobPostings: recentJobs
        },
        topSkills: topSkills.map(skill => ({
          name: skill._id,
          category: skill.category,
          demand: skill.count
        })),
        programAnalyses: analyses.map(analysis => ({
          programName: analysis.curriculumId.programName,
          matchRate: analysis.metrics.overallMatchRate,
          criticalGaps: analysis.metrics.criticalGaps.length,
          lastAnalyzed: analysis.analysisDate
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
};

/**
 * @desc    Get skills coverage report
 * @route   GET /api/analytics/coverage/:curriculumId
 * @access  Private
 */
export const getSkillsCoverage = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const curriculum = await Curriculum.findById(curriculumId).populate('courses');
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    // Extract curriculum skills
    const curriculumSkills = gapAnalysisService.extractCurriculumSkills(curriculum);

    // Get market skills from recent jobs
    const recentJobs = await JobPosting.find({
      postedDate: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    }).limit(100);

    const marketSkills = skillsExtractor.extractFromMultipleJobs(recentJobs);

    // Calculate coverage
    const curriculumSkillSet = new Set(curriculumSkills.map(s => s.name.toLowerCase()));
    
    const coverageReport = {
      totalMarketSkills: marketSkills.length,
      coveredSkills: marketSkills.filter(skill => 
        curriculumSkillSet.has(skill.name.toLowerCase())
      ).length,
      missingSkills: marketSkills.filter(skill => 
        !curriculumSkillSet.has(skill.name.toLowerCase())
      ),
      coveragePercentage: marketSkills.length > 0 
        ? (marketSkills.filter(skill => 
            curriculumSkillSet.has(skill.name.toLowerCase())
          ).length / marketSkills.length) * 100 
        : 0
    };

    res.status(200).json({
      success: true,
      data: coverageReport
    });
  } catch (error) {
    console.error('Get skills coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating skills coverage report'
    });
  }
};
/**
 * @desc    Debug: Test similarity between curriculum and sample jobs
 * @route   GET /api/analytics/debug-similarity/:curriculumId
 * @access  Private
 */
export const debugSimilarity = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 10 } = req.query;

    console.log('\n🧪 === DEBUGGING SIMILARITY SCORES ===');

    // Get curriculum with courses
    const curriculum = await Curriculum.findById(curriculumId)
      .populate('courses')
      .select('+embedding');

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    console.log(`📚 Curriculum: ${curriculum.programName}`);

    // Check if curriculum has embedding
    if (!curriculum.embedding || curriculum.embedding.length === 0) {
      console.log('⚠️  Curriculum has no embedding, generating...');
      const curriculumText = await curriculum.getTextForEmbedding();
      const embedding = await mlService.generateEmbedding(curriculumText);
      
      curriculum.embedding = embedding;
      curriculum.embeddingGenerated = new Date();
      await curriculum.save();
      
      console.log('✅ Curriculum embedding generated');
    } else {
      console.log(`✅ Curriculum has embedding (${curriculum.embedding.length} dimensions)`);
    }

    // Get sample jobs with embeddings
    const jobs = await JobPosting.find({
      embedding: { $exists: true, $ne: null }
    })
      .limit(parseInt(jobLimit))
      .select('+embedding title description category company postedDate');

    console.log(`💼 Testing with ${jobs.length} sample jobs`);

    if (jobs.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No jobs with embeddings found in database'
      });
    }

    // Calculate similarities
    const results = jobs.map(job => {
      const similarity = mlService.calculateSimilarity(
        curriculum.embedding,
        job.embedding
      );

      return {
        jobId: job._id,
        title: job.title,
        category: job.category,
        company: job.company,
        similarity: parseFloat(similarity.toFixed(4)),
        descriptionPreview: job.description.substring(0, 150) + '...'
      };
    });

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    // Calculate statistics
    const similarities = results.map(r => r.similarity);
    const stats = {
      count: similarities.length,
      highest: Math.max(...similarities),
      lowest: Math.min(...similarities),
      average: similarities.reduce((a, b) => a + b, 0) / similarities.length,
      median: similarities[Math.floor(similarities.length / 2)],
      aboveThreshold: {
        '0.3': similarities.filter(s => s >= 0.3).length,
        '0.4': similarities.filter(s => s >= 0.4).length,
        '0.5': similarities.filter(s => s >= 0.5).length,
        '0.6': similarities.filter(s => s >= 0.6).length,
        '0.7': similarities.filter(s => s >= 0.7).length
      }
    };

    console.log('\n📊 Similarity Statistics:');
    console.log(`   Highest: ${stats.highest.toFixed(4)}`);
    console.log(`   Average: ${stats.average.toFixed(4)}`);
    console.log(`   Median: ${stats.median.toFixed(4)}`);
    console.log(`   Lowest: ${stats.lowest.toFixed(4)}`);
    console.log('\n📈 Threshold Distribution:');
    Object.entries(stats.aboveThreshold).forEach(([threshold, count]) => {
      console.log(`   >=${threshold}: ${count} jobs (${((count / similarities.length) * 100).toFixed(1)}%)`);
    });

    res.status(200).json({
      success: true,
      data: {
        curriculum: {
          id: curriculum._id,
          name: curriculum.programName,
          embeddingDimensions: curriculum.embedding.length,
          coursesCount: curriculum.courses?.length || 0
        },
        statistics: stats,
        jobSamples: results,
        recommendation: stats.highest < 0.6 
          ? 'Consider lowering similarity threshold or checking if embeddings are from the same model'
          : stats.average >= 0.6
          ? 'Good embedding alignment - default threshold of 0.6 should work well'
          : 'Moderate alignment - consider threshold around 0.5'
      }
    });

  } catch (error) {
    console.error('🔴 Debug similarity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to debug similarity',
      error: error.message
    });
  }
};
