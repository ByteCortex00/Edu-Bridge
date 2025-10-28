// backend/models/skillGapModels.js
import mongoose from "mongoose";

const criticalGapSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: [true, "Skill name is required for gap analysis"],
  },
  category: {
    type: String,
    default: 'General'
  },
  demandFrequency: {
    type: Number, // how often the skill appears in job postings
    required: true,
  },
  currentCoverage: {
    type: Number, // % of related courses that already cover this skill
    required: true,
  },
  gapSeverity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true,
  },
});

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String, // e.g., 'curriculum update', 'new course', 'skill training'
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
});

const metricsSchema = new mongoose.Schema({
  overallMatchRate: { type: Number, required: true }, // % of market skills covered
  criticalGaps: [criticalGapSchema],
  emergingSkills: [String],
  wellCoveredSkills: [String],
});

const mlStatsSchema = new mongoose.Schema({
  mlFilteringUsed: { type: Boolean, default: false },
  similarityThreshold: { type: Number, default: 0.6 },
  initialJobCount: { type: Number, default: 0 },
  filteredJobCount: { type: Number, default: 0 },
  avgSimilarityScore: { type: Number, default: 0 }
});

const skillsGapSchema = new mongoose.Schema(
  {
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curriculum",
      required: [true, "Curriculum reference is required for analysis"],
    },
    analysisDate: {
      type: Date,
      default: Date.now,
    },
    targetIndustry: {
      type: String,
      required: [true, "Target industry is required for analysis"],
    },
    jobSampleSize: {
      type: Number,
      required: [true, "Job sample size is required for context"],
    },
    metrics: metricsSchema,
    recommendations: [recommendationSchema],
    mlStats: mlStatsSchema
  },
  { timestamps: true }
);

// Index for efficient queries
skillsGapSchema.index({ curriculumId: 1, analysisDate: -1 });
skillsGapSchema.index({ 'metrics.overallMatchRate': -1 });

// Virtual for match rate category
skillsGapSchema.virtual('matchRateCategory').get(function() {
  const rate = this.metrics.overallMatchRate;
  if (rate >= 80) return 'excellent';
  if (rate >= 70) return 'good';
  if (rate >= 50) return 'fair';
  return 'needs-improvement';
});

// Method to get summary
skillsGapSchema.methods.getSummary = function() {
  return {
    programName: this.curriculumId?.programName,
    analysisDate: this.analysisDate,
    matchRate: this.metrics.overallMatchRate,
    criticalGapsCount: this.metrics.criticalGaps.length,
    emergingSkillsCount: this.metrics.emergingSkills.length,
    jobSampleSize: this.jobSampleSize,
    mlUsed: this.mlStats?.mlFilteringUsed || false
  };
};

const SkillsGap = mongoose.model("SkillsGap", skillsGapSchema);
export default SkillsGap;