// backend/models/jobPostingModel.js
import mongoose from "mongoose";

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
      default: 'v1', // Track which model version generated this
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

// Virtual to check if job has valid embedding
jobPostingSchema.virtual('hasEmbedding').get(function() {
  return this.embedding && Array.isArray(this.embedding) && this.embedding.length > 0;
});

// Method to get job text representation for embedding
jobPostingSchema.methods.getTextForEmbedding = function() {
  return `${this.title} ${this.description}`.trim();
};

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
export default JobPosting;