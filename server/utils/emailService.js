const nodemailer = require('nodemailer');

// Trim surrounding quotes that sometimes get copied into hosting dashboards
const stripSurroundingQuotes = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const getSmtpUser = () => stripSurroundingQuotes(process.env.SMTP_USER);
const getSmtpPass = () => stripSurroundingQuotes(process.env.SMTP_PASS);
const getFromAddress = () => `"Belimuno Jobs" <${getSmtpUser() || 'noreply@belimuno.com'}>`;

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if SMTP credentials are properly configured
  const smtpUser = getSmtpUser();
  const smtpPass = getSmtpPass();
  const isEmailConfigured = smtpUser &&
                           smtpUser !== 'your-email@gmail.com' &&
                           smtpPass &&
                           smtpPass !== 'your-app-password';


  // For development or when SMTP credentials are not configured, use console logging
  if (!isEmailConfigured) {
    console.log('⚠️  Email not configured - using console logging mode');
    console.log('📧 To enable real email sending, configure SMTP credentials in .env file');
    return {
      sendMail: async (options) => {
        console.log('\n📧 ===== EMAIL WOULD BE SENT =====');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Text Content:', options.text);
        console.log('HTML Content:', options.html);
        console.log('=====================================\n');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }

  // Production email configuration
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = (process.env.SMTP_SECURE || '').toString().toLowerCase() === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  return transporter;
};

// Create transporter lazily to ensure environment variables are loaded
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: getFromAddress(),
    subject: 'Password Reset Request - Belimuno Jobs',
    text: `
Hello ${userName},

You have requested to reset your password for your Belimuno Jobs account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 10 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
The Belimuno Jobs Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Belimuno Jobs</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background: #2563eb; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Belimuno Jobs Platform</p>
        </div>
        <div class="content">
            <h2>Hello ${userName},</h2>
            <p>You have requested to reset your password for your Belimuno Jobs account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 10 minutes for security reasons.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetUrl}
            </p>
            <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Belimuno Jobs Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `
  };

  try {
    const result = await getTransporter().sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

// Send password reset success email
const sendPasswordResetSuccessEmail = async (email, userName) => {
  const mailOptions = {
    from: getFromAddress(),
    subject: 'Password Reset Successful - Belimuno Jobs',
    text: `
Hello ${userName},

Your password has been successfully reset for your Belimuno Jobs account.

If you did not make this change, please contact our support team immediately.

Best regards,
The Belimuno Jobs Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful - Belimuno Jobs</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Password Reset Successful</h1>
            <p>Belimuno Jobs Platform</p>
        </div>
        <div class="content">
            <h2>Hello ${userName},</h2>
            <div class="success">
                <strong>✅ Success:</strong> Your password has been successfully reset for your Belimuno Jobs account.
            </div>
            <p>You can now log in to your account with your new password.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Belimuno Jobs Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `
  };

  try {
    const result = await getTransporter().sendMail(mailOptions);
    console.log('Password reset success email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    throw error;
  }
};

// Test email functionality
const testEmail = async (testEmail) => {
  const mailOptions = {
    from: getFromAddress(),
    subject: 'Test Email - Belimuno Jobs',
    text: 'This is a test email from Belimuno Jobs to verify email configuration.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>✅ Test Email Successful</h2>
        <p>This is a test email from Belimuno Jobs to verify email configuration.</p>
        <p>If you received this email, the email service is working correctly!</p>
      </div>
    `
  };

  try {
    const result = await getTransporter().sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  testEmail,
  // New contact email helpers
  sendContactMessageEmail: async (toEmail, payload) => {
    const { name, email, phone, subject, message } = payload || {};
    const mailOptions = {
      from: getFromAddress(),
      subject: `📬 New Contact Message: ${subject || 'No subject'}`,
      text: `You have received a new contact message.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nSubject: ${subject}\n\nMessage:\n${message}\n` ,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg,#3b82f6,#1d4ed8); padding:16px; color:#fff; border-radius:12px 12px 0 0;">
            <h2 style="margin:0;">New Contact Message</h2>
            <p style="margin:4px 0 0 0; opacity:0.95;">Belimuno Jobs</p>
          </div>
          <div style="background:#f8fafc; padding:20px; border:1px solid #e5e7eb; border-top:0; border-radius:0 0 12px 12px;">
            <p><strong>Name:</strong> ${name || '-'}<br/>
               <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br/>
               <strong>Phone:</strong> ${phone || '-'}<br/>
               <strong>Subject:</strong> ${subject || '-'}
            </p>
            <div style="margin-top:12px;">
              <p style="margin:0 0 6px 0; font-weight:600;">Message:</p>
              <div style="white-space:pre-wrap; background:#fff; border:1px solid #e5e7eb; padding:12px; border-radius:8px;">${(message || '').replace(/</g,'&lt;')}</div>
            </div>
          </div>
        </div>
      `
    };

    try {
      const result = await getTransporter().sendMail(mailOptions);
      console.log('✅ Contact admin email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error sending contact admin email:', error);
      throw error;
    }
  },
  sendContactAutoReply: async (toEmail, name) => {
    const mailOptions = {
      from: getFromAddress(),
      subject: 'We received your message – Belimuno Jobs',
      text: `Hello ${name || ''},\n\nThanks for reaching out to Belimuno Jobs. We have received your message and our team will get back to you shortly.\n\nBest regards,\nBelimuno Jobs Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg,#10b981,#059669); padding:16px; color:#fff; border-radius:12px 12px 0 0;">
            <h2 style="margin:0;">Thanks for contacting us</h2>
            <p style="margin:4px 0 0 0; opacity:0.95;">Belimuno Jobs</p>
          </div>
          <div style="background:#f8fafc; padding:20px; border:1px solid #e5e7eb; border-top:0; border-radius:0 0 12px 12px;">
            <p>Hello ${name || ''},</p>
            <p>Thanks for reaching out to Belimuno Jobs. We have received your message and our team will get back to you shortly.</p>
            <p style="color:#6b7280; font-size:13px;">If this wasn’t you, you can ignore this email.</p>
            <p style="margin-top:16px;">Best regards,<br/>Belimuno Jobs Team</p>
          </div>
        </div>
      `
    };

    try {
      const result = await getTransporter().sendMail(mailOptions);
      console.log('✅ Contact auto-reply sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error sending contact auto-reply:', error);
      throw error;
    }
  }
};
