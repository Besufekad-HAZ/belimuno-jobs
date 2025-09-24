const asyncHandler = require('../utils/asyncHandler');
const ContactMessage = require('../models/ContactMessage');
const { sendContactMessageEmail, sendContactAutoReply } = require('../utils/emailService');

exports.submit = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  const doc = await ContactMessage.create({ name, email, phone, subject, message });

  // Fire-and-forget emails (do not block response)
  const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminEmail) {
    sendContactMessageEmail(adminEmail, { name, email, phone, subject, message })
      .catch(err => console.error('Contact admin email failed:', err?.message || err));
  }
  if (email) {
    sendContactAutoReply(email, name)
      .catch(err => console.error('Contact auto-reply failed:', err?.message || err));
  }

  res.status(201).json({ success: true, data: { id: doc._id } });
});

exports.list = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, data: messages });
});

exports.markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const msg = await ContactMessage.findByIdAndUpdate(id, { status: 'read' }, { new: true });
  res.status(200).json({ success: true, data: msg });
});


