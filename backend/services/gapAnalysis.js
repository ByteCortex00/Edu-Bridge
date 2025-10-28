// backend/services/gapAnalysis.js
import JobPosting from '../models/jobPostingModel.js';
import Curriculum from '../models/curriculumModel.js';
import SkillsGap from '../models/skillGapModels.js';
import skillsExtractor from './skillExtractor.js';
import mlService from './mlService.js';
import mlConfig from '../config/mlConfig.js';

class GapAnalysisService {
  /**
   * Analyze skills gap for a curriculum
   * ENHANCED: Now uses ML filtering for better job relevance
   */
  async analyzeCurriculum(curriculumId, options = {}) {
    try {
      // Get curriculum with courses
      const curriculum = await Curriculum.findById(curriculumId)
        .populate('courses')
        .select('+embedding'); // Explicitly include embedding field
      
      if (!curriculum) {
        return {
          success: false,
          message: 'Curriculum not found'
        };
      }
      
      console.log('\n🎯 === STARTING SKILLS GAP ANALYSIS ===');
      console.log(`📚 Program: ${curriculum.programName}`);
      console.log(`🏫 Courses: ${curriculum.courses?.length || 0}`);
      
      // ✅ Ensure curriculum has embedding
      let curriculumEmbedding = curriculum.embedding;
      if (!curriculumEmbedding || !Array.isArray(curriculumEmbedding) || curriculumEmbedding.length === 0) {
        console.log('🔄 Generating curriculum embedding...');
        curriculumEmbedding = await this.generateCurriculumEmbedding(curriculum);
      } else {
        console.log('✅ Using existing curriculum embedding');
      }
      
      // Get relevant job postings with ML filtering
      const mlFilteringEnabled = mlService.isModelReady() && options.useML !== false;
      console.log(`🤖 ML Filtering: ${mlFilteringEnabled ? 'ENABLED' : 'DISABLED'}`);
      
      const jobsResult = mlFilteringEnabled 
        ? await this.getRelevantJobsWithML(curriculum, curriculumEmbedding, options)
        : await this.getRelevantJobs(curriculum, options);
      
      const jobs = jobsResult.jobs || jobsResult;
      const mlStats = jobsResult.mlStats || null;
      
      if (jobs.length === 0) {
        return {
          success: false,
          message: 'No relevant jobs found for analysis'
        };
      }
      
      console.log(`\n📊 Analyzing ${jobs.length} jobs...`);
      
      // Extract skills from curriculum
      const curriculumSkills = this.extractCurriculumSkills(curriculum);
      console.log(`📚 Curriculum skills: ${curriculumSkills.length}`);
      
      // Extract skills from job market
      const marketSkills = skillsExtractor.extractFromMultipleJobs(jobs);
      console.log(`💼 Market skills extracted: ${marketSkills.length}`);
      
      if (marketSkills.length === 0) {
        console.log('⚠️ WARNING: No market skills extracted from jobs!');
        return {
          success: false,
          message: 'No skills could be extracted from job postings.'
        };
      }
      
      // Show sample market skills
      console.log('\n📋 Top 10 market skills by demand:');
      marketSkills.slice(0, 10).forEach((skill, idx) => {
        console.log(`   ${idx + 1}. ${skill.name} (${skill.category}) - ${skill.demandRate}% demand`);
      });
      
      // Calculate gaps
      const analysis = this.calculateGaps(curriculumSkills, marketSkills, jobs.length);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);
      
      // Calculate average similarity score if ML filtering was used
      let avgSimilarityScore = 0;
      if (mlStats && jobs.length > 0) {
        const jobsWithScores = jobs.filter(job => job.similarityScore);
        if (jobsWithScores.length > 0) {
          avgSimilarityScore = jobsWithScores.reduce((sum, job) => sum + job.similarityScore, 0) / jobsWithScores.length;
        }
      }

      // Prepare skills gap data
      const skillsGapData = {
        curriculumId,
        analysisDate: new Date(),
        targetIndustry: curriculum.targetIndustries?.[0] || 'General',
        jobSampleSize: jobs.length,
        metrics: {
          overallMatchRate: analysis.overallMatchRate,
          criticalGaps: analysis.criticalGaps.slice(0, 10).map(gap => ({
            skillName: gap.skill,
            category: gap.category,
            demandFrequency: gap.marketDemand,
            currentCoverage: gap.curriculumCoverage || 0,
            gapSeverity: gap.status === 'critical-gap' ? 'critical' : 
                        gap.status === 'moderate-gap' ? 'high' : 'medium'
          })),
          emergingSkills: analysis.emergingSkills.slice(0, 15).map(skill => skill.skill),
          wellCoveredSkills: analysis.wellCoveredSkills.slice(0, 10).map(skill => skill.skill)
        },
        recommendations: recommendations.map(rec => ({
          type: rec.type,
          description: rec.description,
          priority: rec.priority
        })),
        // ✅ Save ML filtering statistics
        mlStats: mlStats ? {
          mlFilteringUsed: true,
          similarityThreshold: options.similarityThreshold || 0.6,
          initialJobCount: mlStats.totalCandidates,
          filteredJobCount: jobs.length,
          avgSimilarityScore: Math.round(avgSimilarityScore * 10000) / 10000 // Round to 4 decimals
        } : {
          mlFilteringUsed: false,
          similarityThreshold: 0,
          initialJobCount: jobs.length,
          filteredJobCount: jobs.length,
          avgSimilarityScore: 0
        }
      };
      
      // Save analysis
      const skillsGap = await SkillsGap.create(skillsGapData);
      
      console.log('\n✅ === ANALYSIS COMPLETE ===');
      console.log(`📈 Match Rate: ${analysis.overallMatchRate.toFixed(1)}%`);
      console.log(`⚠️  Critical Gaps: ${skillsGapData.metrics.criticalGaps.length}`);
      console.log(`🚀 Emerging Skills: ${skillsGapData.metrics.emergingSkills.length}`);
      console.log(`✅ Well-Covered: ${skillsGapData.metrics.wellCoveredSkills.length}\n`);

      return {
        success: true,
        data: skillsGap,
        analysis: analysis, // Include detailed analysis
        mlStats: mlStats, // Include ML filtering stats
        message: `Analysis completed for ${curriculum.programName}`
      };
    } catch (error) {
      console.error('❌ Gap analysis error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Generate embedding for curriculum
   */
  async generateCurriculumEmbedding(curriculum) {
    try {
      const curriculumText = await curriculum.getTextForEmbedding();
      
      if (!curriculumText || curriculumText.length < 20) {
        throw new Error('Insufficient curriculum text for embedding generation');
      }
      
      const embedding = await mlService.generateEmbedding(curriculumText);
      
      // Save embedding to curriculum
      await Curriculum.findByIdAndUpdate(curriculum._id, {
        embedding,
        embeddingGenerated: new Date(),
        embeddingVersion: 'v1',
        embeddingError: null
      });
      
      console.log('✅ Curriculum embedding generated and saved');
      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate curriculum embedding:', error.message);
      throw error;
    }
  }

  /**
   * Get relevant jobs with ML filtering
   * Enhanced version that uses semantic similarity
   */
  async getRelevantJobsWithML(curriculum, curriculumEmbedding, options = {}) {
    const { 
      limit = 100, 
      daysBack = 90, 
      targetIndustry,
      similarityThreshold = mlConfig.similarity.default,
      fetchMultiplier = 3 // Fetch 3x more jobs for filtering
    } = options;
    
    console.log('\n🤖 Starting ML-enhanced job filtering...');
    console.log(`📏 Similarity threshold: ${similarityThreshold}`);
    
    // Calculate the date threshold
    const dateThreshold = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    
    // Build base query
    let baseQuery = {
      postedDate: { $gte: dateThreshold }
    };
    
    // Add industry filter if provided
    if (targetIndustry) {
      baseQuery.$or = [
        { category: targetIndustry },
        { category: { $regex: targetIndustry, $options: 'i' } }
      ];
    } else if (curriculum.targetIndustries && curriculum.targetIndustries.length > 0) {
      // Use curriculum target industries
      baseQuery.$or = curriculum.targetIndustries.flatMap(industry => [
        { category: industry },
        { category: { $regex: industry, $options: 'i' } }
      ]);
    }
    
    // Fetch initial candidate jobs (get more for ML filtering)
    const fetchLimit = limit * fetchMultiplier;
    const candidateJobs = await JobPosting.find(baseQuery)
      .limit(fetchLimit)
      .sort({ postedDate: -1 })
      .select('+embedding title company category description requiredSkills postedDate');
    
    console.log(`📥 Initial candidate jobs: ${candidateJobs.length}`);
    
    if (candidateJobs.length === 0) {
      console.log('⚠️ No candidate jobs found, falling back to basic filtering');
      return this.getRelevantJobs(curriculum, options);
    }
    
    // Separate jobs with and without embeddings
    const jobsWithEmbeddings = candidateJobs.filter(job => 
      job.embedding && Array.isArray(job.embedding) && job.embedding.length > 0
    );
    
    const jobsWithoutEmbeddings = candidateJobs.filter(job => 
      !job.embedding || !Array.isArray(job.embedding) || job.embedding.length === 0
    );
    
    console.log(`📊 Jobs with embeddings: ${jobsWithEmbeddings.length}`);
    console.log(`📊 Jobs without embeddings: ${jobsWithoutEmbeddings.length}`);
    
    let filteredJobs = [];
    let mlStats = {
      totalCandidates: candidateJobs.length,
      jobsWithEmbeddings: jobsWithEmbeddings.length,
      jobsWithoutEmbeddings: jobsWithoutEmbeddings.length,
      similarityThreshold,
      effectiveThreshold: similarityThreshold, // Will be adjusted if needed
      mlFiltered: 0,
      categoryFiltered: 0
    };
    
    // Filter jobs with embeddings using semantic similarity
    if (jobsWithEmbeddings.length > 0) {
      console.log('🔍 Filtering jobs by semantic similarity...');
      
      const similarityScores = jobsWithEmbeddings.map(job => {
        const similarity = mlService.calculateSimilarity(curriculumEmbedding, job.embedding);
        return { job, similarity };
      });
      
      // Sort all jobs by similarity to see the distribution
      similarityScores.sort((a, b) => b.similarity - a.similarity);
      
      // 🆕 Debug: Show similarity score distribution
      console.log('\n📊 Similarity Score Distribution:');
      console.log(`   🥇 Highest: ${similarityScores[0].similarity.toFixed(4)}`);
      console.log(`   📊 Median: ${similarityScores[Math.floor(similarityScores.length / 2)].similarity.toFixed(4)}`);
      console.log(`   📉 Lowest: ${similarityScores[similarityScores.length - 1].similarity.toFixed(4)}`);
      console.log(`   📈 Average: ${(similarityScores.reduce((sum, s) => sum + s.similarity, 0) / similarityScores.length).toFixed(4)}`);
      
      // Count how many jobs pass different thresholds
      const thresholds = [0.3, 0.4, 0.5, 0.6, 0.7];
      console.log('\n📊 Jobs passing different thresholds:');
      thresholds.forEach(threshold => {
        const count = similarityScores.filter(s => s.similarity >= threshold).length;
        console.log(`   ${threshold.toFixed(1)}: ${count} jobs (${((count / similarityScores.length) * 100).toFixed(1)}%)`);
      });
      
      // 🆕 Dynamic threshold adjustment if no jobs pass
      let effectiveThreshold = similarityThreshold;
      let relevantJobs = similarityScores.filter(({ similarity }) => similarity >= effectiveThreshold);
      
      if (relevantJobs.length === 0) {
        // Calculate a reasonable threshold (e.g., top 50% or median)
        const medianSimilarity = similarityScores[Math.floor(similarityScores.length / 2)].similarity;
        effectiveThreshold = Math.min(medianSimilarity, 0.5); // Cap at 0.5 maximum
        
        console.log(`\n⚠️  No jobs passed threshold ${similarityThreshold.toFixed(2)}`);
        console.log(`🔄 Adjusting threshold to ${effectiveThreshold.toFixed(4)} (median similarity)`);
        
        relevantJobs = similarityScores.filter(({ similarity }) => similarity >= effectiveThreshold);
      }
      
      // Take top N jobs
      relevantJobs = relevantJobs.slice(0, limit);
      
      mlStats.mlFiltered = relevantJobs.length;
      mlStats.effectiveThreshold = effectiveThreshold;
      
      console.log(`\n✅ ML-filtered jobs: ${relevantJobs.length}`);
      
      if (relevantJobs.length > 0) {
        console.log(`🎯 Top similarity: ${relevantJobs[0].similarity.toFixed(4)}`);
        console.log(`📉 Bottom similarity: ${relevantJobs[relevantJobs.length - 1].similarity.toFixed(4)}`);
        
        // Show top 5 matched jobs
        console.log('\n🏆 Top 5 matched jobs:');
        relevantJobs.slice(0, 5).forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.job.title} - ${item.job.category} (${item.similarity.toFixed(4)})`);
        });
      }
      
      filteredJobs = relevantJobs.map(({ job, similarity }) => {
        const jobObj = job.toObject ? job.toObject() : job;
        return { ...jobObj, similarityScore: similarity };
      });
    }
    
    // Supplement with category-based jobs if needed
    if (filteredJobs.length < limit && jobsWithoutEmbeddings.length > 0) {
      const needed = limit - filteredJobs.length;
      console.log(`🔄 Supplementing with ${Math.min(needed, jobsWithoutEmbeddings.length)} category-based jobs`);
      
      const supplementalJobs = jobsWithoutEmbeddings
        .slice(0, needed)
        .map(job => job.toObject ? job.toObject() : job);
      
      mlStats.categoryFiltered = supplementalJobs.length;
      filteredJobs = [...filteredJobs, ...supplementalJobs];
    }
    
    // Final fallback
    if (filteredJobs.length === 0) {
      console.log('🔄 ML filtering yielded no results, falling back to category-based filtering');
      return this.getRelevantJobs(curriculum, options);
    }
    
    console.log(`✅ Final job count: ${filteredJobs.length}`);
    console.log(`   - ML filtered: ${mlStats.mlFiltered}`);
    console.log(`   - Category filtered: ${mlStats.categoryFiltered}`);
    
    return {
      jobs: filteredJobs,
      mlStats
    };
  }

  /**
   * Original getRelevantJobs method (fallback)
   */
  async getRelevantJobs(curriculum, options = {}) {
    const { limit = 100, daysBack = 90, targetIndustry } = options;
    
    console.log('\n📊 Using category-based job filtering (fallback)...');
    
    const dateThreshold = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    
    let query = {
      postedDate: { $gte: dateThreshold }
    };
    
    // Determine industries to search
    const industries = targetIndustry 
      ? [targetIndustry]
      : curriculum.targetIndustries && curriculum.targetIndustries.length > 0
        ? curriculum.targetIndustries
        : null;
    
    if (industries && industries.length > 0) {
      query.$or = industries.flatMap(industry => [
        { category: industry },
        { category: { $regex: industry, $options: 'i' } }
      ]);
    }
    
    const jobs = await JobPosting.find(query)
      .limit(limit)
      .sort({ postedDate: -1 })
      .select('title company category description requiredSkills postedDate');
    
    console.log(`✅ Category-based filtered jobs: ${jobs.length}`);
    
    return {
      jobs: jobs.map(job => job.toObject ? job.toObject() : job),
      mlStats: null
    };
  }

  /**
   * Extract skills from curriculum courses
   * FIXED: Now matches your actual Course schema
   */
  extractCurriculumSkills(curriculum) {
    const skillsMap = new Map();
    
    if (!curriculum.courses || curriculum.courses.length === 0) {
      console.log('⚠️ No courses found in curriculum');
      return [];
    }
    
    curriculum.courses.forEach(course => {
      if (course.skills && Array.isArray(course.skills)) {
        course.skills.forEach(skill => {
          const key = skill.name.toLowerCase();
          
          if (skillsMap.has(key)) {
            const existing = skillsMap.get(key);
            existing.frequency += 1;
            // Keep the highest proficiency level
            if (this.getProficiencyLevel(skill.proficiencyLevel) > 
                this.getProficiencyLevel(existing.proficiencyLevel)) {
              existing.proficiencyLevel = skill.proficiencyLevel;
            }
          } else {
            skillsMap.set(key, {
              name: skill.name,
              category: skill.category,
              proficiencyLevel: skill.proficiencyLevel,
              frequency: 1
            });
          }
        });
      }
    });
    
    return Array.from(skillsMap.values());
  }

  /**
   * Convert proficiency level to numerical value
   */
  getProficiencyLevel(level) {
    const levels = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3
    };
    return levels[level?.toLowerCase()] || 0;
  }

  /**
   * Calculate gaps between curriculum and market skills
   */
  calculateGaps(curriculumSkills, marketSkills, totalJobs) {
    const curriculumSkillSet = new Set(
      curriculumSkills.map(skill => skill.name.toLowerCase())
    );
    
    const criticalGaps = [];
    const emergingSkills = [];
    const wellCoveredSkills = [];
    
    let matchedSkillsCount = 0;
    
    // Analyze market skills against curriculum
    marketSkills.forEach(marketSkill => {
      const isCovered = curriculumSkillSet.has(marketSkill.name.toLowerCase());
      
      if (isCovered) {
        matchedSkillsCount++;
        wellCoveredSkills.push({
          skill: marketSkill.name,
          category: marketSkill.category,
          marketDemand: marketSkill.demandRate,
          status: 'well-covered'
        });
      } else {
        const gapSeverity = this.calculateGapSeverity(marketSkill.demandRate);
        
        criticalGaps.push({
          skill: marketSkill.name,
          category: marketSkill.category,
          marketDemand: marketSkill.demandRate,
          curriculumCoverage: 0,
          gapSize: marketSkill.demandRate,
          status: gapSeverity
        });
      }
      
      // Identify emerging skills (high demand but not in curriculum)
      if (marketSkill.demandRate > 20 && !isCovered) {
        emergingSkills.push({
          skill: marketSkill.name,
          category: marketSkill.category,
          marketDemand: marketSkill.demandRate,
          jobCount: marketSkill.jobCount,
          priority: marketSkill.demandRate >= 40 ? 'high' : 
                   marketSkill.demandRate >= 20 ? 'medium' : 'low'
        });
      }
    });
    
    const overallMatchRate = marketSkills.length > 0 
      ? (matchedSkillsCount / marketSkills.length) * 100 
      : 0;
    
    return {
      overallMatchRate: Math.round(overallMatchRate * 100) / 100,
      criticalGaps: criticalGaps.sort((a, b) => b.marketDemand - a.marketDemand),
      emergingSkills: emergingSkills.sort((a, b) => b.marketDemand - a.marketDemand),
      wellCoveredSkills: wellCoveredSkills.sort((a, b) => b.marketDemand - a.marketDemand)
    };
  }

  /**
   * Calculate gap severity based on demand
   */
  calculateGapSeverity(demandRate) {
    if (demandRate >= 50) return 'critical-gap';
    if (demandRate >= 30) return 'moderate-gap';
    if (demandRate >= 15) return 'minor-gap';
    return 'low-gap';
  }

  /**
   * Generate recommendations based on gap analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Critical gaps recommendations
    if (analysis.criticalGaps.length > 0) {
      const topCriticalGaps = analysis.criticalGaps.slice(0, 5);
      recommendations.push({
        type: 'add_skill',
        description: `Add critical skills: ${topCriticalGaps.map(g => g.skill).join(', ')}`,
        priority: 'high'
      });
    }
    
    // Emerging skills recommendations
    if (analysis.emergingSkills.length > 0) {
      const topEmerging = analysis.emergingSkills
        .filter(s => s.priority === 'high')
        .slice(0, 3);
      
      if (topEmerging.length > 0) {
        recommendations.push({
          type: 'monitor_trends',
          description: `Monitor emerging skills: ${topEmerging.map(s => s.skill).join(', ')}`,
          priority: 'medium'
        });
      }
    }
    
    // Overall match rate recommendations
    if (analysis.overallMatchRate < 50) {
      recommendations.push({
        type: 'major_revision',
        description: `Consider major curriculum revision - only ${analysis.overallMatchRate.toFixed(1)}% alignment with market demands`,
        priority: 'high'
      });
    } else if (analysis.overallMatchRate < 70) {
      recommendations.push({
        type: 'moderate_updates',
        description: 'Curriculum needs moderate updates to improve market alignment',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Compare multiple curricula
   */
  async compareInstitutions(curriculumIds) {
    const comparisons = await Promise.all(
      curriculumIds.map(async (id) => {
        const latestAnalysis = await SkillsGap.findOne({ curriculumId: id })
          .sort({ analysisDate: -1 })
          .populate('curriculumId', 'programName institutionId');
        
        return latestAnalysis;
      })
    );
    
    return comparisons.filter(c => c !== null);
  }
}

export default new GapAnalysisService();