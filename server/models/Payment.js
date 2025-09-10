const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  // Transaction Basic Info
  transactionId: { type: String, required: true, unique: true },
  // For legacy gateway fields (no longer used; retained for reference only)
  chapaTransactionId: String,
  chapaReferenceId: String,

  // Relationship
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Payment Details
  amount: { type: Number, required: true },
  currency: { type: String, default: "ETB" },
  paymentMethod: {
    type: String,
    enum: ["manual_check", "admin_adjustment"],
    required: true,
    default: "manual_check",
  },

  // Payment Type and Purpose
  paymentType: {
    type: String,
    enum: ["job_payment", "adjustment"],
    required: true,
    default: "job_payment",
  },
  description: String,

  // Status and Processing
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "refunded",
      "partially_refunded",
    ],
    default: "pending",
  },

  // Financial Breakdown
  breakdown: {
    grossAmount: Number,
    platformFee: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netAmount: Number,
  },

  // Chapa Integration Details
  chapaDetails: {},

  // Timeline
  initiatedAt: { type: Date, default: Date.now },
  processedAt: Date,
  completedAt: Date,

  // Error Handling
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
  },

  // Admin dispute resolution record
  adminResolution: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolution: String,
    action: { type: String, enum: ["refund", "release", "partial"] },
    resolvedAt: Date,
  },

  // Reconciliation
  isReconciled: { type: Boolean, default: false },
  reconciledAt: Date,
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Manual payment proof (client uploads check image)
  proof: {
    imageData: String, // base64 data URL or direct URL (future)
    filename: String,
    mimeType: String,
    note: String,
    uploadedAt: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
// Indexes for performance (unique transactionId index created by unique:true option)
// PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ chapaTransactionId: 1 });
PaymentSchema.index({ job: 1 });
PaymentSchema.index({ payer: 1, status: 1 });
PaymentSchema.index({ recipient: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ paymentType: 1, status: 1 });

// Pre-save middleware
PaymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Payment", PaymentSchema);
