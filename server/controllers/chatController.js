const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

const ALLOWED_ROLES = ['super_admin', 'admin_hr', 'admin_outsource'];

const buildParticipantHash = (participantIds) => {
  return participantIds
    .map((id) => id.toString())
    .sort((a, b) => (a > b ? 1 : -1))
    .join(':');
};

const formatUserSummary = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar:
    user.profile && user.profile.avatar
      ? user.profile.avatar
      : undefined,
});

const formatConversation = (conversation) => ({
  id: conversation._id.toString(),
  participants: (conversation.participants || []).map(formatUserSummary),
  participantRoles: conversation.participantRoles || [],
  lastMessage: conversation.lastMessage
    ? {
        content: conversation.lastMessage.content,
        senderId: conversation.lastMessage.sender
          ? conversation.lastMessage.sender.toString()
          : undefined,
        senderName: conversation.lastMessage.senderName || undefined,
        timestamp: conversation.lastMessage.timestamp,
      }
    : null,
  updatedAt: conversation.updatedAt,
});

const formatMessage = (message) => ({
  id: message._id.toString(),
  senderId: message.sender._id
    ? message.sender._id.toString()
    : message.sender.toString(),
  senderName: message.sender.name || message.senderName,
  content: message.content,
  timestamp: message.createdAt,
  attachments: (message.attachments || []).map((attachment, index) => ({
    id: `${message._id}-${index}`,
    name: attachment.name,
    type: attachment.type,
    url: attachment.url,
    size: attachment.size,
  })),
});

const ensureAllowedParticipants = async (ids) => {
  const users = await User.find({ _id: { $in: ids } }).select(
    'name email role profile.avatar',
  );

  if (users.length !== ids.length) {
    throw new ErrorResponse('One or more participants are invalid.', 400);
  }

  const invalid = users.filter((user) => !ALLOWED_ROLES.includes(user.role));
  if (invalid.length > 0) {
    throw new ErrorResponse(
      'Only super admins, HR admins, and outsource admins can participate in this chat.',
      403,
    );
  }

  return users;
};

exports.getContacts = asyncHandler(async (req, res) => {
  const contacts = await User.find({
    _id: { $ne: req.user._id },
    role: { $in: ALLOWED_ROLES },
    isActive: true,
  })
    .sort({ name: 1 })
    .select('name email role profile.avatar');

  res.status(200).json({
    success: true,
    data: contacts.map(formatUserSummary),
  });
});

exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    $or: [
      { isArchivedBy: { $exists: false } },
      { isArchivedBy: { $nin: [req.user._id] } },
    ],
  })
    .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
    .populate('participants', 'name email role profile.avatar');

  res.status(200).json({
    success: true,
    data: conversations.map(formatConversation),
  });
});

exports.createConversation = asyncHandler(async (req, res) => {
  const { participantIds = [], title } = req.body || {};

  const normalizedIds = Array.from(
    new Set([
      ...participantIds.map((id) => id.toString()),
      req.user._id.toString(),
    ]),
  );

  if (normalizedIds.length < 2) {
    throw new ErrorResponse('A conversation requires at least two participants.', 400);
  }

  const users = await ensureAllowedParticipants(normalizedIds);

  const participantHash = buildParticipantHash(normalizedIds);

  let conversation = await Conversation.findOne({ participantHash })
    .populate('participants', 'name email role profile.avatar');

  if (conversation) {
    if (
      conversation.isArchivedBy &&
      conversation.isArchivedBy.some((userId) =>
        userId.toString() === req.user._id.toString(),
      )
    ) {
      conversation.isArchivedBy = conversation.isArchivedBy.filter(
        (userId) => userId.toString() !== req.user._id.toString(),
      );
      await conversation.save();
      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'name email role profile.avatar',
      );
    }
  } else {
    const created = await Conversation.create({
      participants: normalizedIds,
      participantRoles: users.map((user) => user.role),
      participantHash,
      createdBy: req.user._id,
      title: title || undefined,
    });

    conversation = await Conversation.findById(created._id).populate(
      'participants',
      'name email role profile.avatar',
    );
  }

  res.status(201).json({
    success: true,
    data: formatConversation(conversation),
  });
});

exports.getMessages = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const { before, limit: limitParam } = req.query;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return next(new ErrorResponse('Conversation not found.', 404));
  }

  const conversation = await Conversation.findById(conversationId).populate(
    'participants',
    'name email role profile.avatar',
  );

  if (!conversation) {
    return next(new ErrorResponse('Conversation not found.', 404));
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant._id.toString() === req.user._id.toString(),
  );

  if (!isParticipant) {
    return next(new ErrorResponse('You are not part of this conversation.', 403));
  }

  const limit = Math.min(parseInt(limitParam, 10) || 50, 200);

  const filter = { conversation: conversation._id };
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      filter.createdAt = { $lt: beforeDate };
    }
  }

  const messages = await ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name role profile.avatar');

  const orderedMessages = [...messages].reverse().map(formatMessage);

  res.status(200).json({
    success: true,
    data: orderedMessages,
  });
});

exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const { content = '', attachments = [] } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return next(new ErrorResponse('Conversation not found.', 404));
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new ErrorResponse('Conversation not found.', 404));
  }

  const isParticipant = conversation.participants.some(
    (participantId) => participantId.toString() === req.user._id.toString(),
  );

  if (!isParticipant) {
    return next(new ErrorResponse('You are not part of this conversation.', 403));
  }

  const trimmedContent = content.trim();
  if (!trimmedContent && (!attachments || attachments.length === 0)) {
    return next(new ErrorResponse('Message content or attachments are required.', 400));
  }

  const normalizedAttachments = (attachments || [])
    .filter((attachment) => attachment && attachment.name && attachment.url)
    .map((attachment) => ({
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      size: attachment.size,
    }));

  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: req.user._id,
    senderName: req.user.name,
    content: trimmedContent,
    attachments: normalizedAttachments,
    readBy: [req.user._id],
  });

  conversation.lastMessage = {
    content: trimmedContent ||
      (normalizedAttachments[0] ? `Attachment: ${normalizedAttachments[0].name}` : ''),
    sender: req.user._id,
    senderName: req.user.name,
    timestamp: message.createdAt,
  };
  conversation.updatedAt = message.createdAt;

  await conversation.save();

  await message.populate('sender', 'name role profile.avatar');

  res.status(201).json({
    success: true,
    data: formatMessage(message),
  });
});
