//institution model
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  country: { type: String, required: true },
  region: { type: String },
  city: { type: String },
});

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Institution name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["university", "college", "technical"],
      required: [true, "Institution type is required"],
    },
    location: locationSchema,
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    activePrograms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Curriculum",
      },
    ],
  },
  { timestamps: true }
);

const Institution = mongoose.model("Institution", institutionSchema);
export default Institution;
