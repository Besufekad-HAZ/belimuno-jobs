const mongoose = require("mongoose");

const TrustedCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    order: {
      type: Number,
      default: 0,
    },
    brandColor: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    logo: {
      type: String,
      trim: true,
    },
    logoAlt: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    tags: {
      type: [String],
      default: [],
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
  }
);

TrustedCompanySchema.index({ status: 1, order: 1 });
TrustedCompanySchema.index({ name: 1 });

module.exports = mongoose.model("TrustedCompany", TrustedCompanySchema);
