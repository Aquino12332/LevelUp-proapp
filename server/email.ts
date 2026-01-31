import nodemailer from "nodemailer";

// Check if Resend is configured
const isResendConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

// Check if SMTP email is configured
const isSMTPConfigured = () => {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

// Email configuration
const createTransporter = () => {
  // Check if email is configured
  if (!isSMTPConfigured()) {
    console.warn("⚠️  SMTP Email not configured. Using Resend or logging to console.");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email using Resend API
async function sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LevelUp <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Resend API error:', error);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Email sent via Resend to ${to}:`, data.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  const transporter = createTransporter();
  
  // Generate reset URL
  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password?token=${resetToken}`;
  
  // Email content
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your LevelUp Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 LevelUp</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't change until you click the link and set a new one</li>
                </ul>
              </div>
              
              <p>Stay focused and keep leveling up! 🚀</p>
              <p>- The LevelUp Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please don't reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} LevelUp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${username}!

We received a request to reset your password for LevelUp.

Reset your password by clicking this link:
${resetUrl}

⚠️ Important:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password won't change until you click the link and set a new one

Stay focused and keep leveling up!
- The LevelUp Team

This is an automated email. Please don't reply to this message.
    `,
  };

  try {
    // Try SMTP first if configured (more reliable for any recipient)
    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent via SMTP to ${email}`);
      return true;
    }

    // Fall back to Resend if SMTP not configured
    if (isResendConfigured()) {
      console.log('📧 Using Resend as fallback...');
      return await sendWithResend(email, mailOptions.subject, mailOptions.html);
    }

    // Development mode: log to console if nothing configured
    console.log("\n=== 📧 PASSWORD RESET EMAIL (DEV MODE) ===");
    console.log(`To: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token: ${resetToken}`);
    console.log("=========================================\n");
    return true;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    
    // Try Resend as last resort if SMTP fails
    if (isResendConfigured()) {
      console.log('⚠️ SMTP failed, trying Resend as last resort...');
      return await sendWithResend(email, mailOptions.subject, mailOptions.html);
    }
    
    return false;
  }
}

export async function sendPasswordChangedEmail(
  email: string,
  username: string
): Promise<boolean> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Your LevelUp Password Was Changed",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 LevelUp</h1>
              <p>Password Changed Successfully</p>
            </div>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              
              <div class="success">
                <strong>✅ Your password has been changed successfully!</strong>
              </div>
              
              <p>This is a confirmation that your LevelUp account password was recently changed.</p>
              
              <p><strong>If you made this change:</strong><br>
              No further action is needed. You can now sign in with your new password.</p>
              
              <p><strong>If you didn't make this change:</strong><br>
              Please contact support immediately and secure your account.</p>
              
              <p>Stay secure and keep leveling up! 🔒</p>
              <p>- The LevelUp Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please don't reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} LevelUp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${username}!

✅ Your password has been changed successfully!

This is a confirmation that your LevelUp account password was recently changed.

If you made this change: No further action is needed. You can now sign in with your new password.

If you didn't make this change: Please contact support immediately and secure your account.

Stay secure and keep leveling up!
- The LevelUp Team
    `,
  };

  try {
    // Try Resend first if configured
    if (isResendConfigured()) {
      return await sendWithResend(email, mailOptions.subject, mailOptions.html);
    }

    // Fall back to SMTP if configured
    if (!transporter) {
      // Development mode: log to console
      console.log("\n=== 📧 PASSWORD CHANGED EMAIL (DEV MODE) ===");
      console.log(`To: ${email}`);
      console.log(`Username: ${username}`);
      console.log("===========================================\n");
      return true;
    }

    // Production mode: send actual email via SMTP
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password changed confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending password changed email:", error);
    return false;
  }
}
