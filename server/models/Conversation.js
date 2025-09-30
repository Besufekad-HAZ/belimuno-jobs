const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    participantRoles: [
      {
        type: String,
        enum: ['super_admin', 'admin_hr', 'admin_outsource'],
      },
    ],
    participantHash: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      senderName: String,
      timestamp: Date,
    },
    isArchivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ participantHash: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
