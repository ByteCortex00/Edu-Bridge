// curriculum model
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
  },
  { timestamps: true }
);

const Curriculum = mongoose.model("Curriculum", curriculumSchema);
export default Curriculum;
