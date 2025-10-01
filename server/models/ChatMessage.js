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

ChatMessageSchema.pre('validate', function validate(next) {
  const hasContent = this.content && this.content.trim().length > 0;
  const hasAttachments = Array.isArray(this.attachments) && this.attachments.length > 0;

  if (!hasContent && !hasAttachments) {
    this.invalidate('content', 'A chat message must include text or an attachment');
  }

  next();
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
