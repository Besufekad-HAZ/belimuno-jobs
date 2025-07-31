const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // Relationship
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Review Type
  reviewType: {
    type: String,
    enum: ['client_to_worker', 'worker_to_client'],
    required: true
  },

  // Rating and Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: { type: String, required: true },

  // Detailed Ratings (optional breakdown)
  detailedRatings: {
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },

  // Review Status
  status: {
    type: String,
    enum: ['draft', 'published', 'hidden'],
    default: 'published'
  },

  // Moderation
  isReported: { type: Boolean, default: false },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },

  // Response from reviewee
  response: {
    content: String,
    respondedAt: Date
  },

  // Metadata
  isPublic: { type: Boolean, default: true },
  helpfulVotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
ReviewSchema.index({ job: 1 });
ReviewSchema.index({ reviewer: 1 });
ReviewSchema.index({ reviewee: 1 });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ createdAt: -1 });

// Ensure one review per user per job per type
ReviewSchema.index({ job: 1, reviewer: 1, reviewType: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
