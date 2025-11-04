const asyncHandler = require('../utils/asyncHandler');
const ContactMessage = require('../models/ContactMessage');
const { sendContactMessageEmail, sendContactAutoReply } = require('../utils/emailService');

exports.submit = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  const doc = await ContactMessage.create({ name, email, phone, subject, message });

  // Ensure emails fully complete before responding when running in serverless
  // environments (e.g., Vercel) where background work can be cancelled once
  // the HTTP response finishes. Promise.allSettled avoids throwing while still
  // letting us log individual failures.
  const emailTasks = [];
  const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminEmail) {
    emailTasks.push({
      label: 'admin notification',
      promise: sendContactMessageEmail(adminEmail, { name, email, phone, subject, message })
    });
  }
  if (email) {
    emailTasks.push({
      label: 'contact auto-reply',
      promise: sendContactAutoReply(email, name)
    });
  }

  if (emailTasks.length > 0) {
    const results = await Promise.allSettled(emailTasks.map((task) => task.promise));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const context = emailTasks[index]?.label || 'contact email';
        console.error(`Contact ${context} failed:`, result.reason?.message || result.reason);
      }
    });
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


