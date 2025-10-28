import { 
  getAllSkills, 
  getSkillCategory, 
  normalizeSkill,
  getSkillsForAdzunaCategory
} from '../utils/skillsTaxonomy.js';

class SkillsExtractor {
  constructor() {
    this.skillsDatabase = getAllSkills();
  }

  /**
   * Extract skills from job description text
   */
  extractSkills(text, jobCategory = null) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    const lowerText = text.toLowerCase();
    const foundSkills = new Map();
    
    this.skillsDatabase.forEach(skill => {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      const matches = lowerText.match(regex);
      
      if (matches) {
        const normalizedSkill = normalizeSkill(skill);
        const taxonomyCategory = getSkillCategory(normalizedSkill);
        const category = taxonomyCategory || jobCategory || 'other';
        const importance = this.determineImportance(text, skill);
        
        if (foundSkills.has(normalizedSkill)) {
          const existing = foundSkills.get(normalizedSkill);
          existing.frequency += matches.length;
          if (importance === 'required') {
            existing.importance = 'required';
          }
        } else {
          foundSkills.set(normalizedSkill, {
            name: normalizedSkill,
            category,
            frequency: matches.length,
            importance
          });
        }
      }
    });
    
    return Array.from(foundSkills.values());
  }

  /**
   * Determine if a skill is required or preferred based on context
   */
  determineImportance(text, skill) {
    const lowerText = text.toLowerCase();
    const skillLower = skill.toLowerCase();
    const skillIndex = lowerText.indexOf(skillLower);
    
    if (skillIndex === -1) return 'preferred';
    
    const contextStart = Math.max(0, skillIndex - 50);
    const contextEnd = Math.min(lowerText.length, skillIndex + skill.length + 50);
    const context = lowerText.substring(contextStart, contextEnd);
    
    const requiredKeywords = [
      'required', 'must have', 'essential', 'mandatory', 'necessary',
      'need', 'needs', 'require', 'requires', 'requirement',
      'minimum', 'qualification', 'critical'
    ];
    
    const preferredKeywords = [
      'preferred', 'nice to have', 'plus', 'bonus', 'advantage',
      'desirable', 'beneficial', 'ideal', 'would be nice'
    ];
    
    for (const keyword of preferredKeywords) {
      if (context.includes(keyword)) {
        return 'preferred';
      }
    }
    
    for (const keyword of requiredKeywords) {
      if (context.includes(keyword)) {
        return 'required';
      }
    }
    
    return 'required';
  }

  /**
   * HYBRID METHOD: Extract skills using both pre-extracted requiredSkills and description
   * This is the RECOMMENDED method to use
   */
  extractFromMultipleJobs(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }

    const aggregatedSkills = new Map();
    let jobsWithPreExtractedSkills = 0;
    let jobsNeedingExtraction = 0;
    let jobsWithNoSkills = 0;
    
    jobs.forEach(job => {
      let skills = [];
      
      // Strategy 1: Use pre-extracted requiredSkills if available and has content
      if (job.requiredSkills && Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0) {
        jobsWithPreExtractedSkills++;
        skills = job.requiredSkills.map(skill => ({
          name: skill.name,
          category: skill.category || 'other',
          frequency: 1,
          importance: skill.importance || 'required'
        }));
      } 
      // Strategy 2: Extract from description if no pre-extracted skills
      else if (job.description && job.description.length > 50) {
        jobsNeedingExtraction++;
        const category = job.category || null;
        skills = this.extractSkills(job.description, category);
      } else {
        jobsWithNoSkills++;
      }
      
      // Aggregate the skills
      skills.forEach(skill => {
        const key = skill.name.toLowerCase();
        
        if (aggregatedSkills.has(key)) {
          const existing = aggregatedSkills.get(key);
          existing.jobCount += 1;
          existing.totalMentions += skill.frequency || 1;
          
          if (skill.importance === 'required') {
            existing.requiredCount += 1;
          } else {
            existing.preferredCount += 1;
          }
        } else {
          aggregatedSkills.set(key, {
            name: skill.name,
            category: skill.category || 'other',
            jobCount: 1,
            totalMentions: skill.frequency || 1,
            requiredCount: skill.importance === 'required' ? 1 : 0,
            preferredCount: skill.importance === 'preferred' ? 1 : 0,
            demandRate: 0
          });
        }
      });
    });
    
    console.log(`\n📊 Skill Extraction Statistics:`);
    console.log(`   ✅ Jobs with pre-extracted skills: ${jobsWithPreExtractedSkills}`);
    console.log(`   🔍 Jobs needing text extraction: ${jobsNeedingExtraction}`);
    console.log(`   ⚠️  Jobs with no skills: ${jobsWithNoSkills}`);
    
    // Calculate demand rate based on jobs that actually have skills
    const totalJobsWithSkills = jobsWithPreExtractedSkills + jobsNeedingExtraction;
    console.log(`   📊 Total jobs used for demand calculation: ${totalJobsWithSkills}`);
    
    aggregatedSkills.forEach(skill => {
      // Use totalJobsWithSkills for more accurate demand rate
      skill.demandRate = (skill.jobCount / totalJobsWithSkills) * 100;
      skill.demandRate = Math.round(skill.demandRate * 100) / 100;
    });
    
    return Array.from(aggregatedSkills.values())
      .sort((a, b) => b.demandRate - a.demandRate);
  }

  /**
   * Get top N most demanded skills from job postings
   */
  getTopSkills(jobs, limit = 20) {
    const allSkills = this.extractFromMultipleJobs(jobs);
    return allSkills.slice(0, limit);
  }

  /**
   * Get skills grouped by category
   */
  getSkillsByCategory(jobs) {
    const allSkills = this.extractFromMultipleJobs(jobs);
    const grouped = {};
    
    allSkills.forEach(skill => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    });
    
    return grouped;
  }

  /**
   * Compare skills in job description vs curriculum skills
   */
  compareSkills(jobDescription, curriculumSkills, jobCategory = null) {
    const jobSkills = this.extractSkills(jobDescription, jobCategory);
    const curriculumSkillSet = new Set(
      curriculumSkills.map(s => normalizeSkill(s.toLowerCase()))
    );
    
    const matched = [];
    const missing = [];
    
    jobSkills.forEach(skill => {
      if (curriculumSkillSet.has(skill.name)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });
    
    const matchRate = jobSkills.length > 0 
      ? (matched.length / jobSkills.length) * 100 
      : 0;
    
    return {
      matchRate: Math.round(matchRate * 100) / 100,
      totalJobSkills: jobSkills.length,
      matchedSkills: matched,
      missingSkills: missing
    };
  }
}

const skillsExtractor = new SkillsExtractor();
export default skillsExtractor;