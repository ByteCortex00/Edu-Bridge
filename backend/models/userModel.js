import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        // Password is required only for non-Clerk users
        return !this.clerkId;
      },
      minlength: 6,
    },
    clerkId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when present
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["admin", "institution"],
      default: "institution",
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password to hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;