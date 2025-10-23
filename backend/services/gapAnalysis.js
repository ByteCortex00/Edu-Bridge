// backend/services/gapAnalysis.js
import JobPosting from '../models/jobPostingModel.js';
import Curriculum from '../models/curriculumModel.js';
import SkillsGap from '../models/skillGapModels.js';
import skillsExtractor from './skillExtractor.js';

class GapAnalysisService {
  /**
   * Analyze skills gap for a curriculum
   */
  async analyzeCurriculum(curriculumId, options = {}) {
    try {
      // Get curriculum with courses
      const curriculum = await Curriculum.findById(curriculumId)
        .populate('courses');
      
      if (!curriculum) {
        return {
          success: false,
          message: 'Curriculum not found'
        };
      }
      
      // Get relevant job postings
      const jobs = await this.getRelevantJobs(curriculum, options);
      
      if (jobs.length === 0) {
        return {
          success: false,
          message: 'No relevant jobs found for analysis'
        };
      }
      
      // Extract skills from curriculum
      const curriculumSkills = this.extractCurriculumSkills(curriculum);
      
      // Extract skills from job market
      const marketSkills = skillsExtractor.extractFromMultipleJobs(jobs);
      
      // Calculate gaps
      const analysis = this.calculateGaps(curriculumSkills, marketSkills, jobs.length);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);
      
      // Save analysis
      const skillsGap = await SkillsGap.create({
        curriculumId,
        analysisDate: new Date(),
        targetIndustry: curriculum.targetIndustries[0] || 'General',
        jobSampleSize: jobs.length,
        metrics: {
          overallMatchRate: analysis.overallMatchRate,
          criticalGaps: analysis.criticalGaps,
          emergingSkills: analysis.emergingSkills,
          wellCoveredSkills: analysis.wellCoveredSkills
        },
        recommendations
      });

      return {
        success: true,
        data: skillsGap,
        message: `Analysis completed for ${curriculum.programName}`
      };
    } catch (error) {
      console.error('Gap analysis error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get relevant job postings for curriculum
   */
  async getRelevantJobs(curriculum, options = {}) {
    const { limit = 100, daysBack = 90 } = options;
    
    const query = {
      postedDate: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      }
    };
    
    // Add target industries to query if available (use flexible matching)
    if (curriculum.targetIndustries && curriculum.targetIndustries.length > 0) {
      // Build regex clauses for each industry to allow partial/case-insensitive matches
      const industryClauses = curriculum.targetIndustries.flatMap(ind => ([
        { category: { $regex: ind, $options: 'i' } },
        { 'requiredSkills.category': { $regex: ind, $options: 'i' } },
        { 'requiredSkills.name': { $regex: ind, $options: 'i' } }
      ]));

      query.$or = industryClauses;
    }

    // First attempt with industry filter
    let jobs = await JobPosting.find(query)
      .limit(limit)
      .sort({ postedDate: -1 });

    // If none found, relax the industry filter and try again as a fallback
    if ((!jobs || jobs.length === 0) && query.$or) {
      const fallbackQuery = {
        postedDate: query.postedDate
      };

      jobs = await JobPosting.find(fallbackQuery)
        .limit(limit)
        .sort({ postedDate: -1 });
    }

    return jobs;
  }

  /**
   * Extract skills from curriculum courses
   */
  extractCurriculumSkills(curriculum) {
    const skillsMap = new Map();
    
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
    return levels[level] || 0;
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
        // wellCoveredSkills is defined as [String] in the schema; store skill names only
        wellCoveredSkills.push(marketSkill.name);
      } else {
        const gapSeverity = this.calculateGapSeverity(marketSkill.demandRate);
        
        criticalGaps.push({
          skillName: marketSkill.name,
          category: marketSkill.category,
          demandFrequency: marketSkill.demandRate,
          currentCoverage: 0,
          gapSeverity
        });
      }
      
      // Identify emerging skills (high demand but not in curriculum)
      if (marketSkill.demandRate > 20 && !isCovered) {
        emergingSkills.push(marketSkill.name);
      }
    });
    
    const overallMatchRate = marketSkills.length > 0 
      ? (matchedSkillsCount / marketSkills.length) * 100 
      : 0;
    
    return {
      overallMatchRate: Math.round(overallMatchRate * 100) / 100,
      criticalGaps: criticalGaps
        .sort((a, b) => b.demandFrequency - a.demandFrequency)
        .slice(0, 10),
      emergingSkills: emergingSkills.slice(0, 15),
      wellCoveredSkills: wellCoveredSkills
        .sort((a, b) => b.demandFrequency - a.demandFrequency)
        .slice(0, 10)
    };
  }

  /**
   * Calculate gap severity based on demand
   */
  calculateGapSeverity(demandRate) {
    if (demandRate >= 50) return 'critical';
    if (demandRate >= 30) return 'high';
    if (demandRate >= 15) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on gap analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Critical gaps recommendations
    analysis.criticalGaps.slice(0, 5).forEach(gap => {
      recommendations.push({
        type: 'add_skill',
        description: `Add "${gap.skillName}" to curriculum - appears in ${gap.demandFrequency.toFixed(1)}% of job postings`,
        priority: 'high',
        skillName: gap.skillName,
        category: gap.category
      });
    });
    
    // Emerging skills recommendations
    if (analysis.emergingSkills.length > 0) {
      recommendations.push({
        type: 'monitor_trends',
        description: `Monitor emerging skills: ${analysis.emergingSkills.slice(0, 5).join(', ')}`,
        priority: 'medium'
      });
    }
    
    // Overall match rate recommendations
    if (analysis.overallMatchRate < 50) {
      recommendations.push({
        type: 'major_revision',
        description: `Consider major curriculum revision - only ${analysis.overallMatchRate.toFixed(1)}% alignment with market demands`,
        // Schema allows 'low'|'medium'|'high' for priority
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