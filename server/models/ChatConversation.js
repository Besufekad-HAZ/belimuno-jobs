const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin_hr", "admin_outsource"],
      required: true,
    },
  },
  { _id: false },
);

const ChatConversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    participants: {
      type: [ParticipantSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "A conversation requires at least two participants",
      },
    },
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      senderName: String,
      timestamp: Date,
    },
  },
  {
    timestamps: true,
  },
);

ChatConversationSchema.index({ "participants.user": 1 });
ChatConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("ChatConversation", ChatConversationSchema);
