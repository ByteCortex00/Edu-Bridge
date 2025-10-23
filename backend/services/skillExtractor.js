import { 
  getAllSkills, 
  getSkillCategory, 
  normalizeSkill 
} from '../utils/skillsTaxonomy.js';

class SkillsExtractor {
  constructor() {
    this.skillsDatabase = getAllSkills();
  }

  /**
   * Extract skills from job description text
   * @param {string} text - Job description text
   * @returns {Array} Array of skill objects with name, category, frequency, importance
   */
  extractSkills(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    const lowerText = text.toLowerCase();
    const foundSkills = new Map();
    
    // Search for each skill in the text using word boundaries
    this.skillsDatabase.forEach(skill => {
      // Create regex pattern that matches whole words or phrases
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      const matches = lowerText.match(regex);
      
      if (matches) {
        const normalizedSkill = normalizeSkill(skill);
        const category = getSkillCategory(normalizedSkill);
        const importance = this.determineImportance(text, skill);
        
        // If skill already found (e.g., through an alias), update it
        if (foundSkills.has(normalizedSkill)) {
          const existing = foundSkills.get(normalizedSkill);
          existing.frequency += matches.length;
          // Keep the higher importance level
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
   * @param {string} text - Full job description
   * @param {string} skill - The skill to check
   * @returns {string} 'required' or 'preferred'
   */
  determineImportance(text, skill) {
    const lowerText = text.toLowerCase();
    const skillLower = skill.toLowerCase();
    const skillIndex = lowerText.indexOf(skillLower);
    
    if (skillIndex === -1) return 'preferred';
    
    // Get context around the skill (50 characters before and after)
    const contextStart = Math.max(0, skillIndex - 50);
    const contextEnd = Math.min(lowerText.length, skillIndex + skill.length + 50);
    const context = lowerText.substring(contextStart, contextEnd);
    
    // Keywords that indicate required skills
    const requiredKeywords = [
      'required', 'must have', 'essential', 'mandatory', 'necessary',
      'need', 'needs', 'require', 'requires', 'requirement',
      'minimum', 'qualification', 'critical'
    ];
    
    // Keywords that indicate preferred skills
    const preferredKeywords = [
      'preferred', 'nice to have', 'plus', 'bonus', 'advantage',
      'desirable', 'beneficial', 'ideal', 'would be nice'
    ];
    
    // Check for preferred keywords first (less common, more specific)
    for (const keyword of preferredKeywords) {
      if (context.includes(keyword)) {
        return 'preferred';
      }
    }
    
    // Check for required keywords
    for (const keyword of requiredKeywords) {
      if (context.includes(keyword)) {
        return 'required';
      }
    }
    
    // Default to required if no clear indication
    return 'required';
  }

  /**
   * Extract skills from multiple job postings and aggregate results
   * @param {Array} jobs - Array of job objects with description field
   * @returns {Array} Aggregated skills with demand statistics
   */
  extractFromMultipleJobs(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }

    const aggregatedSkills = new Map();
    
    jobs.forEach(job => {
      const description = job.description || '';
      const skills = this.extractSkills(description);
      
      skills.forEach(skill => {
        if (aggregatedSkills.has(skill.name)) {
          const existing = aggregatedSkills.get(skill.name);
          existing.jobCount += 1;
          existing.totalMentions += skill.frequency;
          
          // Track importance distribution
          if (skill.importance === 'required') {
            existing.requiredCount += 1;
          } else {
            existing.preferredCount += 1;
          }
        } else {
          aggregatedSkills.set(skill.name, {
            name: skill.name,
            category: skill.category,
            jobCount: 1, // Number of jobs mentioning this skill
            totalMentions: skill.frequency,
            requiredCount: skill.importance === 'required' ? 1 : 0,
            preferredCount: skill.importance === 'preferred' ? 1 : 0,
            demandRate: 0 // Will be calculated next
          });
        }
      });
    });
    
    // Calculate demand rate (percentage of jobs requiring this skill)
    const totalJobs = jobs.length;
    aggregatedSkills.forEach(skill => {
      skill.demandRate = (skill.jobCount / totalJobs) * 100;
      skill.demandRate = Math.round(skill.demandRate * 100) / 100; // Round to 2 decimals
    });
    
    // Convert to array and sort by demand rate
    return Array.from(aggregatedSkills.values())
      .sort((a, b) => b.demandRate - a.demandRate);
  }

  /**
   * Get top N most demanded skills from job postings
   * @param {Array} jobs - Array of job objects
   * @param {number} limit - Number of top skills to return
   * @returns {Array} Top skills sorted by demand
   */
  getTopSkills(jobs, limit = 20) {
    const allSkills = this.extractFromMultipleJobs(jobs);
    return allSkills.slice(0, limit);
  }

  /**
   * Get skills grouped by category
   * @param {Array} jobs - Array of job objects
   * @returns {Object} Skills grouped by category
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
   * @param {string} jobDescription - Job description text
   * @param {Array} curriculumSkills - Array of curriculum skill names
   * @returns {Object} Match analysis with matched and missing skills
   */
  compareSkills(jobDescription, curriculumSkills) {
    const jobSkills = this.extractSkills(jobDescription);
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

// Export singleton instance
const skillsExtractor = new SkillsExtractor();
export default skillsExtractor;