const mongoose = require("mongoose");

const OrgStructureDocumentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    contentType: {
      type: String,
      default: "application/pdf",
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    deactivatedAt: {
      type: Date,
    },
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

OrgStructureDocumentSchema.index({ isActive: 1, createdAt: -1 });
OrgStructureDocumentSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "OrgStructureDocument",
  OrgStructureDocumentSchema
);
