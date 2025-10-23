// course model
import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Skill name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Skill category is required"],
    trim: true,
  },
  proficiencyLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: [true, "Skill proficiency level is required"],
  },
});

const courseSchema = new mongoose.Schema(
  {
    curriculumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Curriculum",
      required: [true, "Curriculum reference is required"],
    },
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      trim: true,
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, "Course credits are required"],
    },
    description: {
      type: String,
      trim: true,
    },
    skills: [skillSchema],
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
