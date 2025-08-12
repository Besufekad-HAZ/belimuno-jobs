const mongoose = require('mongoose');

const EscalationSchema = new mongoose.Schema({
  // Basic Information
  escalationId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },

  // Relationship
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  against: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Escalation Type and Category
  type: {
    type: String,
    enum: ['payment_dispute', 'quality_issue', 'communication_problem', 'deadline_missed', 'policy_violation', 'fraud_report', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Evidence and Documentation
  evidence: [{
    type: {
      type: String,
      enum: ['screenshot', 'document', 'message_log', 'payment_proof', 'other']
    },
    filename: String,
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Status and Processing
  status: {
    type: String,
    enum: ['open', 'under_review', 'investigating', 'pending_response', 'resolved', 'closed', 'escalated_further'],
    default: 'open'
  },

  // Assignment and Handling
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: Date,

  // Communication and Updates
  updates: [{
    message: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }, // Internal admin notes vs public updates
    attachments: [String]
  }],

  // Resolution
  resolution: {
    summary: String,
    action: {
      type: String,
      enum: ['no_action', 'warning_issued', 'refund_processed', 'account_suspended', 'job_reassigned', 'payment_released', 'custom']
    },
    actionDetails: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    satisfactionRating: { type: Number, min: 1, max: 5 } // Rating from the person who raised the escalation
  },

  // SLA and Timeline
  slaTarget: Date, // When this should be resolved by
  isOverdue: { type: Boolean, default: false },
  responseTime: Number, // Time to first response in minutes
  resolutionTime: Number, // Total time to resolution in minutes

  // Related Escalations
  relatedEscalations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Escalation' }],
  parentEscalation: { type: mongoose.Schema.Types.ObjectId, ref: 'Escalation' },

  // Impact Assessment
  impact: {
    financialAmount: Number,
    affectedUsers: Number,
    businessImpact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  },

  // Metadata
  isUrgent: { type: Boolean, default: false },
  tags: [String],
  internalNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
EscalationSchema.index({ escalationId: 1 });
EscalationSchema.index({ raisedBy: 1, status: 1 });
EscalationSchema.index({ assignedTo: 1, status: 1 });
EscalationSchema.index({ job: 1 });
EscalationSchema.index({ type: 1, status: 1 });
EscalationSchema.index({ priority: 1, createdAt: -1 });
EscalationSchema.index({ slaTarget: 1, status: 1 });

// Pre-save middleware
EscalationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Auto-generate escalation ID if not provided
  if (!this.escalationId) {
    this.escalationId = 'ESC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Check if overdue
  if (this.slaTarget && this.slaTarget < new Date() && this.status !== 'resolved' && this.status !== 'closed') {
    this.isOverdue = true;
  }

  next();
});

module.exports = mongoose.model('Escalation', EscalationSchema);
