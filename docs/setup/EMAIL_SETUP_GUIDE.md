# Email Setup Guide for Password Reset

## Overview

The password reset feature requires email configuration to send reset links to users. In development, emails are logged to the console. For production, you need to configure an email service.

---

## 🚀 Quick Start (Development)

**Good news!** In development mode, you don't need to configure email. Password reset links are automatically logged to your console.

When a user requests a password reset, you'll see:

```
=== 📧 PASSWORD RESET EMAIL (DEV MODE) ===
To: user@example.com
Username: john_doe
Reset URL: http://localhost:5000/reset-password?token=abc123...
Token: abc123...
=========================================
```

Just copy the reset URL and test it in your browser!

---

## 📧 Production Email Setup

For production, you need to configure an email service. Here are the most popular options:

### Option 1: Gmail (Easiest for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Create an App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "LevelUp App"
   - Copy the 16-character password

3. **Add to `.env`:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM="LevelUp <your.email@gmail.com>"
   APP_URL=https://your-production-url.com
   ```

**Note:** Gmail has sending limits (500 emails/day for free accounts)

---

### Option 2: SendGrid (Recommended for Production)

SendGrid offers 100 free emails/day, perfect for small apps.

1. **Create Account:**
   - Sign up at https://sendgrid.com
   - Verify your email

2. **Create API Key:**
   - Go to Settings > API Keys
   - Create API Key with "Mail Send" permission
   - Copy the API key

3. **Add to `.env`:**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   EMAIL_FROM="LevelUp <noreply@yourdomain.com>"
   APP_URL=https://your-production-url.com
   ```

**Free Tier:** 100 emails/day forever ✅

---

### Option 3: Mailgun (Good Alternative)

1. **Create Account:**
   - Sign up at https://www.mailgun.com
   - Verify your domain (or use sandbox for testing)

2. **Get SMTP Credentials:**
   - Go to Sending > Domain Settings > SMTP Credentials
   - Note your username and password

3. **Add to `.env`:**
   ```env
   EMAIL_HOST=smtp.mailgun.org
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-mailgun-username
   EMAIL_PASS=your-mailgun-password
   EMAIL_FROM="LevelUp <noreply@yourdomain.com>"
   APP_URL=https://your-production-url.com
   ```

**Free Tier:** 5,000 emails/month for 3 months ✅

---

### Option 4: Amazon SES (Best for Scale)

1. **Create AWS Account** and verify identity
2. **Get SMTP Credentials** from SES console
3. **Add to `.env`:**
   ```env
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-ses-username
   EMAIL_PASS=your-ses-password
   EMAIL_FROM="LevelUp <noreply@yourdomain.com>"
   APP_URL=https://your-production-url.com
   ```

**Free Tier:** 62,000 emails/month (if sent from EC2) ✅

---

## 🔧 Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port (usually 587 or 465) | `587` |
| `EMAIL_SECURE` | Use SSL/TLS? (true for 465, false for 587) | `false` |
| `EMAIL_USER` | SMTP username or API key | `your.email@gmail.com` |
| `EMAIL_PASS` | SMTP password or API key | `your-app-password` |
| `EMAIL_FROM` | Sender name and email | `"LevelUp <noreply@yourapp.com>"` |
| `APP_URL` | Your app's URL (for reset links) | `https://yourapp.com` |

---

## 🧪 Testing Your Email Setup

### 1. Start Your App
```bash
npm run dev
```

### 2. Test Password Reset
1. Go to http://localhost:5000/signin
2. Click "Forgot password?"
3. Enter a user's email address
4. Click "Send Reset Link"

### 3. Check Results

**Development Mode (no EMAIL_HOST configured):**
- Check your terminal/console for the reset URL
- Copy and paste the URL to test

**Production Mode (EMAIL_HOST configured):**
- Check the user's email inbox
- Look for "Reset Your LevelUp Password" email
- Click the reset link

---

## 📝 Email Templates

The app sends two types of emails:

### 1. Password Reset Email
**Subject:** Reset Your LevelUp Password  
**Contains:**
- Personalized greeting with username
- Reset password button/link
- Link expires in 1 hour warning
- Security notice

### 2. Password Changed Confirmation
**Subject:** Your LevelUp Password Was Changed  
**Contains:**
- Confirmation of password change
- Security alert if user didn't make the change
- Timestamp of change

Both emails are:
- ✅ Mobile-responsive
- ✅ Beautifully designed with brand colors
- ✅ Include both HTML and plain text versions
- ✅ Professional and secure

---

## 🔒 Security Features

### Token Security
- Tokens are randomly generated (32 bytes, hex encoded)
- Tokens expire after 1 hour
- Tokens are single-use (deleted after password reset)
- Invalid/expired tokens return clear error messages

### Email Enumeration Prevention
- System always returns success message, even if email doesn't exist
- Prevents attackers from discovering valid email addresses
- Actual email only sent if account exists

### OAuth User Protection
- Google sign-in users can't reset passwords (they don't have one!)
- Clear message directs them to sign in with Google

### Password Requirements
- Minimum 6 characters
- Hashed with bcrypt (10 salt rounds)
- Stored securely in database

---

## 🐛 Troubleshooting

### "Failed to send email" Error

**Check:**
1. All EMAIL_* variables are set in `.env`
2. SMTP credentials are correct
3. Port is not blocked by firewall
4. Email service is not in sandbox mode (SendGrid/Mailgun)

**Solution:**
- Check server console for detailed error messages
- Verify credentials with email provider
- Test SMTP connection with a tool like Telnet

### Email Not Received

**Check:**
1. Spam/junk folder
2. Email address is correct
3. Email service sending limits
4. Domain verification (for custom domains)

**Solution:**
- Check email service dashboard for delivery logs
- Verify sender domain is properly configured
- Check email service quotas

### Reset Link Expired

**Issue:** Link expires after 1 hour

**Solution:**
- Request a new reset link from /forgot-password
- New link invalidates old links automatically

### "This account uses Google sign-in"

**Issue:** User trying to reset password for OAuth account

**Solution:**
- User should click "Continue with Google" instead
- OAuth users don't have passwords to reset

---

## 📊 Email Service Comparison

| Service | Free Tier | Best For | Difficulty |
|---------|-----------|----------|------------|
| **Gmail** | 500/day | Testing, small apps | ⭐ Easy |
| **SendGrid** | 100/day | Production, startups | ⭐⭐ Medium |
| **Mailgun** | 5,000/month (3 mo) | Medium apps | ⭐⭐ Medium |
| **Amazon SES** | 62,000/month* | Large scale | ⭐⭐⭐ Hard |

*From EC2 instances only

---

## 🎯 Recommended Setup

### For Development:
```env
# No email configuration needed!
# Reset links will be logged to console
```

### For Small Production Apps:
```env
# Use SendGrid (100 free emails/day)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM="LevelUp <noreply@yourdomain.com>"
APP_URL=https://your-app.com
```

### For Large Production Apps:
```env
# Use Amazon SES (62k free emails/month)
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-username
EMAIL_PASS=your-ses-password
EMAIL_FROM="LevelUp <noreply@yourdomain.com>"
APP_URL=https://your-app.com
```

---

## 🚀 Next Steps

1. **Development:** Start testing with console logging (no setup needed!)
2. **Production:** Choose an email service from the options above
3. **Configure:** Add credentials to your `.env` file
4. **Test:** Send a test reset email
5. **Deploy:** Your password reset feature is ready! 🎉

---

## 💡 Pro Tips

- **Development:** Use console logging - it's faster and free
- **Testing:** Use a service like [Mailtrap.io](https://mailtrap.io) for email testing
- **Production:** Start with SendGrid's free tier, upgrade as needed
- **Security:** Never commit `.env` file (already in `.gitignore`)
- **Monitoring:** Check email service dashboard for delivery metrics
- **Custom Domain:** Configure SPF/DKIM records for better deliverability

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/integrations)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Email Best Practices](https://www.mailgun.com/blog/email-best-practices/)

---

Need help? Check the troubleshooting section or the main README_SETUP.md file! 😊
