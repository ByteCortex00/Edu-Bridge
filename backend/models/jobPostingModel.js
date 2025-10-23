// job posting model 
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
  },
  { timestamps: true }
);

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);
export default JobPosting;
