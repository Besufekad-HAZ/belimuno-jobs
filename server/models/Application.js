const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  // Basic Information
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Application Details
  proposal: { type: String, required: true },
  proposedBudget: { type: Number, required: true },
  estimatedDuration: String, // e.g., "5 days", "2 weeks"

  // Status Tracking
  status: {
    type: String,
    enum: [
      "pending",
      "reviewed",
      "shortlisted",
      "accepted",
      "rejected",
      "withdrawn",
    ],
    default: "pending",
  },
  shortlistedAt: Date,
  shortlistedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shortlistNotes: String,

  // Timeline
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  respondedAt: Date,

  // Additional Information
  coverLetter: String,
  attachments: [
    {
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  // Review by Client/Area Manager
  reviewNotes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
ApplicationSchema.index({ job: 1, worker: 1 }, { unique: true }); // One application per worker per job
ApplicationSchema.index({ worker: 1, status: 1 });
ApplicationSchema.index({ job: 1, status: 1 });
ApplicationSchema.index({ appliedAt: -1 });

// Pre-save middleware
ApplicationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Application", ApplicationSchema);
