// backend/controllers/analyticsController.js
import SkillsGap from '../models/skillGapModels.js';
import Curriculum from '../models/curriculumModel.js';
import JobPosting from '../models/jobPostingModel.js';
import gapAnalysisService from '../services/gapAnalysis.js';
import skillsExtractor from '../services/skillsExtractor.js';

/**
 * @desc    Run skills gap analysis for a curriculum
 * @route   POST /api/analytics/analyze/:curriculumId
 * @access  Private
 */
export const analyzeSkillsGap = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { jobLimit = 100, daysBack = 90, targetIndustry } = req.body;

    // Validate curriculum exists
    const curriculum = await Curriculum.findById(curriculumId);
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }

    const analysis = await gapAnalysisService.analyzeCurriculum(curriculumId, {
      limit: jobLimit,
      daysBack: daysBack,
      targetIndustry: targetIndustry
    });

    if (!analysis.success) {
      return res.status(400).json(analysis);
    }

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Analyze skills gap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during skills gap analysis'
    });
  }
};

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