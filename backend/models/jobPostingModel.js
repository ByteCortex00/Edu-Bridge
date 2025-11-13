// backend/models/jobPostingModel.js
import mongoose from "mongoose";
import { mlConfig } from '../config/mlConfig.js';

const requiredSkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Skill name is required"],
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  importance: {
    type: String,
    enum: ["required", "preferred"],
    default: "required",
  },
});

const locationSchema = new mongoose.Schema({
  country: { type: String },
  region: { type: String },
  city: { type: String },
});

const jobPostingSchema = new mongoose.Schema(
  {
    adzunaId: {
      type: String,
      unique: true,
      index: true,
      required: [true, "Adzuna job ID is required"],
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    location: locationSchema,
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    salaryMin: Number,
    salaryMax: Number,
    category: {
      type: String,
      trim: true,
    },
    contractType: {
      type: String,
      trim: true,
    },
    requiredSkills: [requiredSkillSchema],
    postedDate: Date,
    expiryDate: Date,
    sourceUrl: String,
    rawData: Object,
    
    // ✨ NEW FIELDS FOR ML
    embedding: {
      type: [Number],
      default: null,
      select: false, // Don't include in queries by default (saves bandwidth)
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
      default: null, // Store error message if embedding generation failed
    }
  },
  { timestamps: true }
);

// Index for efficient embedding queries
jobPostingSchema.index({ embeddingGenerated: 1 });
jobPostingSchema.index({ embeddingVersion: 1 });
jobPostingSchema.index({ category: 1 });
jobPostingSchema.index({ 'location.country': 1 });
jobPostingSchema.index({ postedDate: -1 });

// Virtual to check if job has valid embedding
jobPostingSchema.virtual('hasEmbedding').get(function() {
  return this.embedding && 
         Array.isArray(this.embedding) && 
         this.embedding.length === mlConfig.model.embeddingDimensions;
});

// Method to get job text representation for weighted embedding
jobPostingSchema.methods.getTextForEmbedding = function() {
  const weightedTexts = [];
  const weights = mlConfig.embeddingWeights;

  // HIGH SIGNAL: Technical requirements, specific skills, tools
  let highSignalText = '';

  // Job title (important for matching)
  highSignalText += `${this.title}. `;

  // Required skills (technical ones)
  if (this.requiredSkills && this.requiredSkills.length > 0) {
    const technicalSkills = this.requiredSkills.filter(skill => {
      const technicalCategories = ['programming', 'database', 'cloud', 'devops', 'security', 'data science', 'ai/ml', 'engineering', 'technical', 'software', 'development', 'system'];
      return technicalCategories.some(cat => skill.category?.toLowerCase().includes(cat)) && skill.importance === 'required';
    });

    if (technicalSkills.length > 0) {
      const skillNames = technicalSkills.map(skill => skill.name);
      highSignalText += `Required technical skills: ${skillNames.join(', ')}. `;
    }

    // Extract technical terms from description
    const description = this.description.toLowerCase();
    const technicalTerms = [];
    const commonTechTerms = [
      'python', 'javascript', 'java', 'c++', 'c#', 'react', 'node.js', 'angular', 'vue', 
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
      'machine learning', 'artificial intelligence', 'data analysis', 'big data'
    ];

    commonTechTerms.forEach(term => {
      if (description.includes(term.toLowerCase())) {
        technicalTerms.push(term);
      }
    });

    if (technicalTerms.length > 0) {
      highSignalText += `Technical requirements: ${technicalTerms.join(', ')}. `;
    }
  }

  if (highSignalText.trim()) {
    weightedTexts.push({ text: highSignalText.trim(), weight: weights.hardSkills });
  }

  // MEDIUM SIGNAL: Job context, category, contract type
  let mediumSignalText = '';

  // Category and contract type
  if (this.category) {
    mediumSignalText += `Category: ${this.category}. `;
  }
  if (this.contractType) {
    mediumSignalText += `Contract: ${this.contractType}. `;
  }

  // Company (if available)
  if (this.company) {
    mediumSignalText += `Company: ${this.company}. `;
  }

  // Location context
  if (this.location && (this.location.city || this.location.country)) {
    const locationStr = [this.location.city, this.location.region, this.location.country].filter(Boolean).join(', ');
    mediumSignalText += `Location: ${locationStr}. `;
  }

  if (mediumSignalText.trim()) {
    weightedTexts.push({ text: mediumSignalText.trim(), weight: weights.coreContext });
  }

  // LOW SIGNAL: General descriptions, soft skills
  let lowSignalText = '';

  // Soft skills from required skills
  if (this.requiredSkills && this.requiredSkills.length > 0) {
    const softSkills = this.requiredSkills.filter(skill => {
      const softCategories = ['communication', 'leadership', 'teamwork', 'management', 'soft skills', 'interpersonal', 'collaboration', 'problem-solving', 'analytical'];
      return softCategories.some(cat => skill.category?.toLowerCase().includes(cat));
    });

    if (softSkills.length > 0) {
      const skillNames = softSkills.map(skill => skill.name);
      lowSignalText += `Soft skills: ${skillNames.join(', ')}. `;
    }
  }

  // General description (filtered to remove technical terms already captured)
  if (this.description) {
    // Simple filtering to avoid duplication - remove sentences with technical terms
    let generalDesc = this.description;
    const techTerms = ['python', 'javascript', 'java', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'react', 'node.js', 'tensorflow', 'pytorch'];
    techTerms.forEach(term => {
      const regex = new RegExp(`[^.]*${term}[^.]*\\.`, 'gi');
      generalDesc = generalDesc.replace(regex, '');
    });

    // Clean up any resulting double spaces or empty sentences
    generalDesc = generalDesc.replace(/\s+/g, ' ').trim();
    
    if (generalDesc.length > 50) { // Only include if there's substantial content left
      lowSignalText += `Job context: ${generalDesc}. `;
    }
  }

  if (lowSignalText.trim()) {
    weightedTexts.push({ text: lowSignalText.trim(), weight: weights.softSkills });
  }

  return weightedTexts;
};

// Method to validate embedding dimensions
jobPostingSchema.methods.validateEmbedding = function() {
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

// Static method to find jobs with valid embeddings
jobPostingSchema.statics.findWithEmbeddings = function(query = {}) {
  return this.find({
    ...query,
    embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
  });
};

// Static method to find jobs needing embedding generation
jobPostingSchema.statics.findWithoutEmbeddings = function(query = {}) {
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

// Static method to find recent jobs (for embedding prioritization)
jobPostingSchema.statics.findRecentForEmbedding = function(days = 30, limit = 1000) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.findWithoutEmbeddings({
    postedDate: { $gte: cutoffDate }
  }).limit(limit);
};

// Pre-save middleware to validate embedding if present
jobPostingSchema.pre('save', function(next) {
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

// Method to check if embedding needs update
jobPostingSchema.methods.needsEmbeddingUpdate = function() {
  return !this.hasEmbedding || 
         this.embeddingVersion !== mlConfig.model.version ||
         (this.embeddingGenerated && 
          new Date() - this.embeddingGenerated > 30 * 24 * 60 * 60 * 1000); // 30 days
};

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
export default JobPosting;