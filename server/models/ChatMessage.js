const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    url: String,
    size: Number,
  },
  { _id: false },
);

const ChatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [AttachmentSchema],
    readBy: [
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

ChatMessageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
