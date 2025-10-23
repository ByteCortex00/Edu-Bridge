// skills gap model
import mongoose from "mongoose";

const criticalGapSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: [true, "Skill name is required for gap analysis"],
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
  },
  { timestamps: true }
);

const SkillsGap = mongoose.model("SkillsGap", skillsGapSchema);
export default SkillsGap;
