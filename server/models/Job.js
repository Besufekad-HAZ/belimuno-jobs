const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  // Basic Job Information
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: String,
  tags: [String],

  // Financial Details
  budget: { type: Number, required: true },
  budgetType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  currency: { type: String, default: 'ETB' },

  // Timeline
  deadline: { type: Date, required: true },
  estimatedHours: Number,
  startDate: Date,
  completionDate: Date,

  // Job Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'posted', 'in_review', 'assigned', 'in_progress', 'submitted', 'revision_requested', 'completed', 'cancelled', 'disputed'],
    default: 'draft'
  },
  workerAcceptance: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
  default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Relationships
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  // areaManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Removed - role no longer exists

  // Worker Selection
  applicants: [{
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    proposal: String,
    proposedBudget: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],

  // Requirements and Skills
  requiredSkills: [String],
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    default: 'intermediate'
  },

  // Files and Attachments
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  deliverables: [{
    filename: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  }],

  // Progress Tracking
  progress: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [{
      title: String,
      description: String,
      targetDate: Date,
      completedDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      }
    }],
    updates: [{
      message: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date, default: Date.now },
      attachments: [String]
    }]
  },

  // Payment and Financial Tracking
  payment: {
    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    escrowAmount: { type: Number, default: 0 },
    platformFee: Number,
    workerEarnings: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'approved_for_payment', 'paid', 'refunded', 'disputed'],
      default: 'pending'
    },
    // Remove gateway specific fields; keep history for auditing
    paymentHistory: [{
      amount: Number,
      type: { type: String },
      transactionId: String,
      processedAt: { type: Date, default: Date.now },
      status: String
    }]
  },

  // Communication
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    attachments: [String],
    sentAt: { type: Date, default: Date.now },
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: Date
    }]
  }],

  // Review and Feedback
  review: {
    clientReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      reviewedAt: Date
    },
    workerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      reviewedAt: Date
    }
  },

  // Revision Tracking
  revisions: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending'
    }
  }],

  // Dispute Management
  dispute: {
    isDisputed: { type: Boolean, default: false },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    raisedAt: Date,
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution: String,
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'escalated'],
      default: 'open'
    }
  },

  // Metadata
  isPublic: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better query performance
JobSchema.index({ client: 1, status: 1 });
JobSchema.index({ worker: 1, status: 1 });
JobSchema.index({ region: 1, status: 1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ category: 1, subcategory: 1 });
JobSchema.index({ deadline: 1 });
JobSchema.index({ 'requiredSkills': 1 });

// Pre-save middleware to update timestamps
JobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', JobSchema);
