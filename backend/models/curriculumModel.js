// backend/models/curriculumModel.js
import mongoose from "mongoose";

const curriculumSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: [true, "Institution reference is required"],
    },
    programName: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
    },
    degree: {
      type: String,
      enum: ["certificate", "diploma", "bachelor", "master", "phd"],
      required: [true, "Degree type is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
    duration: {
      type: Number,
      required: [true, "Program duration (in months) is required"],
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    targetIndustries: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    
    // ✨ NEW FIELDS FOR ML
    embedding: {
      type: [Number],
      default: null,
      select: false, // Don't include in queries by default
    },
    embeddingVersion: {
      type: String,
      default: 'v1',
    },
    embeddingGenerated: {
      type: Date,
      default: null,
    },
    embeddingError: {
      type: String,
      default: null,
    }
  },
  { timestamps: true }
);

// Index for efficient embedding queries
curriculumSchema.index({ embeddingGenerated: 1 });
curriculumSchema.index({ embeddingVersion: 1 });

// Virtual to check if curriculum has valid embedding
curriculumSchema.virtual('hasEmbedding').get(function() {
  return this.embedding && Array.isArray(this.embedding) && this.embedding.length > 0;
});

// Enhanced method to get curriculum text representation for embedding
curriculumSchema.methods.getTextForEmbedding = async function() {
  // Populate courses if not already populated
  if (!this.populated('courses')) {
    await this.populate('courses');
  }
  
  // Build comprehensive text representation with MORE context
  let text = '';
  
  // 1. Program identity with context
  text += `${this.programName} ${this.degree} program in ${this.department}. `;
  
  // 2. Program description (if available)
  if (this.description) {
    text += `Program overview: ${this.description} `;
  }
  
  // 3. Target industries with context
  if (this.targetIndustries && this.targetIndustries.length > 0) {
    text += `This program prepares students for careers in ${this.targetIndustries.join(', ')}. `;
  }
  
  // 4. Course information with MORE detail
  if (this.courses && this.courses.length > 0) {
    text += 'Core curriculum includes: ';
    
    this.courses.forEach((course, index) => {
      // Include course name
      text += `${course.courseName}`;
      
      // Include course description if available
      if (course.description) {
        text += ` (${course.description})`;
      }
      
      // Add separator
      if (index < this.courses.length - 1) {
        text += ', ';
      } else {
        text += '. ';
      }
    });
    
    // 5. Skills summary with MORE context
    const allSkills = [];
    const skillsByCategory = {};
    
    this.courses.forEach(course => {
      if (course.skills && Array.isArray(course.skills)) {
        course.skills.forEach(skill => {
          allSkills.push(skill.name);
          
          // Group by category
          if (!skillsByCategory[skill.category]) {
            skillsByCategory[skill.category] = [];
          }
          skillsByCategory[skill.category].push(skill.name);
        });
      }
    });
    
    // Remove duplicates
    const uniqueSkills = [...new Set(allSkills)];
    
    if (uniqueSkills.length > 0) {
      text += `Students will gain expertise in ${uniqueSkills.length} key skills including: `;
      text += `${uniqueSkills.slice(0, 30).join(', ')}. `; // Limit to first 30 skills
      
      // Add category-based context
      const categories = Object.keys(skillsByCategory);
      if (categories.length > 0) {
        text += `Skills are focused on ${categories.join(', ')} domains. `;
      }
    }
    
    // 6. Add skill proficiency context
    const advancedSkills = [];
    this.courses.forEach(course => {
      if (course.skills) {
        course.skills.forEach(skill => {
          if (skill.proficiencyLevel === 'advanced') {
            advancedSkills.push(skill.name);
          }
        });
      }
    });
    
    const uniqueAdvanced = [...new Set(advancedSkills)];
    if (uniqueAdvanced.length > 0) {
      text += `Advanced proficiency is achieved in: ${uniqueAdvanced.slice(0, 15).join(', ')}. `;
    }
  }
  
  // 7. Add typical career outcomes/job roles context
  // This helps match against job titles!
  const careerRoles = this.generateCareerRoles();
  if (careerRoles) {
    text += `Graduates typically pursue roles such as ${careerRoles}. `;
  }
  
  return text.trim();
};

// Generic helper method to generate typical career roles based on program and department
curriculumSchema.methods.generateCareerRoles = function() {
  const programLower = this.programName.toLowerCase();
  const departmentLower = this.department.toLowerCase();
  
  // Comprehensive field mapping
  const fieldRoles = {
    // Business & Management
    'business': 'Business Analyst, Project Manager, Business Development Manager, Operations Manager, Consultant',
    'management': 'Manager, Team Lead, Operations Manager, Project Manager, Department Head',
    'administration': 'Administrator, Office Manager, Executive Assistant, Operations Coordinator',
    'finance': 'Financial Analyst, Investment Banker, Accountant, Financial Advisor, Risk Analyst',
    'accounting': 'Accountant, Auditor, Tax Advisor, Financial Controller, Bookkeeper',
    'marketing': 'Marketing Manager, Digital Marketing Specialist, Brand Manager, Marketing Analyst',
    'economics': 'Economist, Policy Analyst, Research Analyst, Financial Analyst, Data Analyst',
    
    // Healthcare & Medicine
    'medicine': 'Doctor, Physician, Medical Researcher, Surgeon, General Practitioner',
    'nursing': 'Registered Nurse, Nurse Practitioner, Clinical Nurse, Nurse Educator',
    'pharmacy': 'Pharmacist, Pharmacy Technician, Clinical Pharmacist, Pharmaceutical Researcher',
    'public health': 'Public Health Specialist, Epidemiologist, Health Educator, Community Health Worker',
    'healthcare': 'Healthcare Administrator, Medical Officer, Health Services Manager',
    
    // Engineering (all types)
    'engineering': 'Engineer, Project Engineer, Design Engineer, Engineering Manager',
    'civil': 'Civil Engineer, Structural Engineer, Construction Manager, Site Engineer',
    'mechanical': 'Mechanical Engineer, Design Engineer, Manufacturing Engineer, HVAC Engineer',
    'electrical': 'Electrical Engineer, Power Engineer, Control Systems Engineer, Electronics Engineer',
    'chemical': 'Chemical Engineer, Process Engineer, Plant Engineer, Safety Engineer',
    
    // Computer Science & IT
    'computer': 'Software Engineer, Software Developer, IT Specialist, Systems Analyst',
    'software': 'Software Engineer, Software Developer, Full Stack Developer, Backend Developer',
    'information technology': 'IT Specialist, Systems Administrator, Network Engineer, IT Consultant',
    'data science': 'Data Scientist, Data Analyst, Machine Learning Engineer, Business Intelligence Analyst',
    'cybersecurity': 'Security Analyst, Security Engineer, Penetration Tester, Security Consultant',
    
    // Sciences
    'biology': 'Biologist, Research Scientist, Lab Technician, Biology Teacher, Environmental Scientist',
    'chemistry': 'Chemist, Research Scientist, Lab Technician, Quality Control Analyst',
    'physics': 'Physicist, Research Scientist, Physics Teacher, Engineer, Data Analyst',
    'mathematics': 'Mathematician, Data Analyst, Statistician, Math Teacher, Actuary',
    'environmental': 'Environmental Scientist, Conservation Officer, Sustainability Specialist, Environmental Consultant',
    
    // Social Sciences & Humanities
    'psychology': 'Psychologist, Counselor, Therapist, Human Resources Specialist, Researcher',
    'sociology': 'Sociologist, Social Researcher, Policy Analyst, Community Development Officer',
    'political': 'Policy Analyst, Government Officer, Political Consultant, Researcher',
    'history': 'Historian, History Teacher, Archivist, Museum Curator, Researcher',
    'english': 'Writer, Editor, Content Manager, English Teacher, Copywriter',
    'communication': 'Communications Specialist, Public Relations Officer, Media Planner, Content Strategist',
    
    // Education
    'education': 'Teacher, Educator, Instructional Coordinator, Education Administrator, Curriculum Developer',
    'teaching': 'Teacher, Educator, Instructor, Professor, Education Specialist',
    
    // Arts & Design
    'art': 'Artist, Art Director, Graphic Designer, Creative Director, Art Teacher',
    'design': 'Designer, Graphic Designer, UX/UI Designer, Product Designer, Creative Director',
    'music': 'Musician, Music Teacher, Composer, Music Director, Sound Engineer',
    'film': 'Filmmaker, Video Editor, Director, Producer, Cinematographer',
    
    // Law & Criminal Justice
    'law': 'Lawyer, Attorney, Legal Advisor, Paralegal, Legal Researcher',
    'criminal justice': 'Police Officer, Detective, Corrections Officer, Probation Officer, Security Manager'
  };

  // Check for matches in program name first, then department
  for (const [field, roles] of Object.entries(fieldRoles)) {
    if (programLower.includes(field) || departmentLower.includes(field)) {
      return roles;
    }
  }
  
  // Generic fallback based on degree level
  const degreeTitles = {
    'certificate': 'Certified Professional, Specialist, Technician',
    'diploma': 'Diploma Holder, Junior Professional, Assistant',
    'bachelor': 'Graduate, Junior Professional, Entry-Level Specialist',
    'master': 'Senior Professional, Specialist, Manager, Consultant',
    'phd': 'Expert, Researcher, Senior Consultant, Director, Professor'
  };
  
  return degreeTitles[this.degree] || 'Professional, Specialist, Graduate';
};

const Curriculum = mongoose.model("Curriculum", curriculumSchema);
export default Curriculum;