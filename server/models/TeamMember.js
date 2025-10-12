const mongoose = require("mongoose");

const TeamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    photoKey: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    order: {
      type: Number,
      default: 999,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

TeamMemberSchema.index({ order: 1, name: 1 });

module.exports = mongoose.model("TeamMember", TeamMemberSchema);
