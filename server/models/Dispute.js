const mongoose = require("mongoose");

const DisputeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "investigating", "resolved", "closed"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  type: {
    type: String,
    enum: ["payment", "quality", "communication", "deadline", "scope", "other"],
    required: true,
  },
  // Relationships
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  // Evidence
  evidence: [
    {
      type: {
        type: String,
        enum: ["image", "document", "message"],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Resolution
  resolution: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // HR Notes
  hrNotes: String,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
DisputeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
DisputeSchema.index({ status: 1, priority: 1 });
DisputeSchema.index({ worker: 1 });
DisputeSchema.index({ client: 1 });
DisputeSchema.index({ job: 1 });
DisputeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Dispute", DisputeSchema);
