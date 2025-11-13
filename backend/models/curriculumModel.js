// backend/models/curriculumModel.js
import mongoose from "mongoose";
import { mlConfig } from '../config/mlConfig.js';

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
      default: mlConfig.model.version, // Use version from config
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
curriculumSchema.index({ institutionId: 1 });

// Virtual to check if curriculum has valid embedding
curriculumSchema.virtual('hasEmbedding').get(function() {
  return this.embedding && 
         Array.isArray(this.embedding) && 
         this.embedding.length === mlConfig.model.embeddingDimensions;
});

// Enhanced method to get curriculum text representation for weighted embedding
curriculumSchema.methods.getTextForEmbedding = async function() {
  // Populate courses if not already populated
  if (!this.populated('courses')) {
    await this.populate('courses');
  }

  const weightedTexts = [];
  const weights = mlConfig.embeddingWeights;

  // HIGH SIGNAL (0.7): Hard skills, technical content, course names
  let highSignalText = '';

  if (this.courses && this.courses.length > 0) {
    // Technical course names
    const courseNames = this.courses.map(course => course.courseName).join(', ');
    highSignalText += `Technical courses: ${courseNames}. `;

    // Hard skills (technical skills)
    const hardSkills = [];
    this.courses.forEach(course => {
      if (course.skills && Array.isArray(course.skills)) {
        course.skills.forEach(skill => {
          // Consider skills with technical categories as hard skills
          const technicalCategories = ['programming', 'database', 'cloud', 'devops', 'security', 'data science', 'ai/ml', 'engineering', 'technical', 'software', 'development'];
          if (technicalCategories.some(cat => skill.category?.toLowerCase().includes(cat))) {
            hardSkills.push(skill.name);
          }
        });
      }
    });

    const uniqueHardSkills = [...new Set(hardSkills)];
    if (uniqueHardSkills.length > 0) {
      highSignalText += `Technical skills: ${uniqueHardSkills.slice(0, 20).join(', ')}. `;
    }

    // Advanced proficiency skills
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
      highSignalText += `Advanced expertise: ${uniqueAdvanced.slice(0, 15).join(', ')}. `;
    }
  }

  if (highSignalText.trim()) {
    weightedTexts.push({ text: highSignalText.trim(), weight: weights.hardSkills });
  }

  // MEDIUM SIGNAL (0.2): Core context, program details, industries
  let mediumSignalText = '';

  // Program identity
  mediumSignalText += `${this.programName} ${this.degree} program in ${this.department}. `;

  // Target industries
  if (this.targetIndustries && this.targetIndustries.length > 0) {
    mediumSignalText += `Target industries: ${this.targetIndustries.join(', ')}. `;
  }

  // Career roles
  const careerRoles = this.generateCareerRoles();
  if (careerRoles) {
    mediumSignalText += `Career paths: ${careerRoles}. `;
  }

  if (mediumSignalText.trim()) {
    weightedTexts.push({ text: mediumSignalText.trim(), weight: weights.coreContext });
  }

  // LOW SIGNAL (0.1): Soft skills, general descriptions
  let lowSignalText = '';

  // Program description
  if (this.description) {
    lowSignalText += `Program description: ${this.description}. `;
  }

  // Soft skills
  if (this.courses && this.courses.length > 0) {
    const softSkills = [];
    this.courses.forEach(course => {
      if (course.skills && Array.isArray(course.skills)) {
        course.skills.forEach(skill => {
          const softCategories = ['communication', 'leadership', 'teamwork', 'management', 'soft skills', 'interpersonal', 'collaboration'];
          if (softCategories.some(cat => skill.category?.toLowerCase().includes(cat))) {
            softSkills.push(skill.name);
          }
        });
      }
    });

    const uniqueSoftSkills = [...new Set(softSkills)];
    if (uniqueSoftSkills.length > 0) {
      lowSignalText += `Soft skills: ${uniqueSoftSkills.slice(0, 10).join(', ')}. `;
    }
  }

  if (lowSignalText.trim()) {
    weightedTexts.push({ text: lowSignalText.trim(), weight: weights.softSkills });
  }

  return weightedTexts;
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
    'artificial intelligence': 'AI Engineer, Machine Learning Engineer, Data Scientist, AI Researcher',
    'machine learning': 'Machine Learning Engineer, Data Scientist, AI Specialist, ML Researcher',
    
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

// Method to validate embedding dimensions
curriculumSchema.methods.validateEmbedding = function() {
  if (!this.embedding) {
    return { valid: false, reason: 'No embedding found' };
  }
  
  if (!Array.isArray(this.embedding)) {
    return { valid: false, reason: 'Embedding is not an array' };
  }
  
  if (this.embedding.length !== mlConfig.model.embeddingDimensions) {
    return { 
      valid: false, 
      reason: `Embedding dimensions mismatch. Expected: ${mlConfig.model.embeddingDimensions}, Got: ${this.embedding.length}` 
    };
  }
  
  return { valid: true };
};

// Static method to find curricula with valid embeddings
curriculumSchema.statics.findWithEmbeddings = function(query = {}) {
  return this.find({
    ...query,
    embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
  });
};

// Static method to find curricula needing embedding generation
curriculumSchema.statics.findWithoutEmbeddings = function(query = {}) {
  return this.find({
    ...query,
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $size: 0 } },
      { embeddingVersion: { $ne: mlConfig.model.version } }
    ]
  });
};

// Pre-save middleware to validate embedding if present
curriculumSchema.pre('save', function(next) {
  if (this.embedding && this.embedding.length > 0) {
    const validation = this.validateEmbedding();
    if (!validation.valid) {
      this.embeddingError = validation.reason;
    } else {
      this.embeddingError = null;
      this.embeddingGenerated = new Date();
    }
  }
  next();
});

const Curriculum = mongoose.model("Curriculum", curriculumSchema);
export default Curriculum;