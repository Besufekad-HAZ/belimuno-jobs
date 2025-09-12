# Email Setup Guide for Belimuno Jobs

## Current Issue
The password reset functionality is not sending actual emails because the email service is not properly configured. Currently, it only logs emails to the console.

## Quick Fix for Development

### Option 1: Use Console Logging (Current)
The system is currently set to log emails to the console instead of sending them. When you request a password reset, check the server console for the reset link.

### Option 2: Configure Real Email Sending

#### For Gmail (Recommended for testing):

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the 16-character password

3. **Update the .env file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

#### For Other Email Providers:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## Testing Email Configuration

Run the test script to verify email configuration:

```bash
cd server
node test-email.js
```

## Current Status

✅ **Password Reset API**: Working correctly
✅ **Email Templates**: Beautiful HTML emails ready
✅ **Token Generation**: Secure tokens with 10-minute expiration
❌ **Email Sending**: Not configured (logs to console)

## What Happens Now

1. User requests password reset
2. System generates secure token
3. System shows "Check Your Email" screen
4. **Currently**: Email is logged to console (not sent)
5. **After setup**: Email is sent to user's inbox

## Console Output Example

When email is not configured, you'll see:
```
⚠️  Email not configured - using console logging mode
📧 To enable real email sending, configure SMTP credentials in .env file

📧 ===== EMAIL WOULD BE SENT =====
To: user@example.com
Subject: Password Reset Request - Belimuno Jobs
Text Content: [Reset instructions]
HTML Content: [Beautiful HTML email]
=====================================
```

## Next Steps

1. **For immediate testing**: Check server console for reset links
2. **For production**: Configure real email credentials
3. **For development**: Use Gmail app password setup above

The password reset functionality is fully implemented and working - it just needs email configuration to send actual emails instead of logging them.
