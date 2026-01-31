# 📧 Gmail SMTP Setup Guide

Switch from Resend to Gmail SMTP to send emails to any recipient without domain verification.

---

## 🎯 Quick Setup (5 Minutes)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to: https://myaccount.google.com/security
2. Find **"2-Step Verification"**
3. Click **"Get Started"** and follow the prompts
4. **You MUST enable 2FA to create App Passwords**

---

### Step 2: Create Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. Under "App passwords", click **"Select app"**
4. Choose **"Mail"**
5. Under "Select device", choose **"Other (Custom name)"**
6. Enter: **"LevelUp App"**
7. Click **"Generate"**
8. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ You won't be able to see it again!

---

### Step 3: Add to Render Environment Variables

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click your **levelup-app** service
3. Go to **"Environment"** tab
4. Add these variables:

```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = your.email@gmail.com
EMAIL_PASS = abcdefghijklmnop (the 16-char app password, NO SPACES)
EMAIL_FROM = LevelUp <your.email@gmail.com>
APP_URL = https://your-app.onrender.com
```

5. Click **"Save Changes"**
6. Render will automatically redeploy (~3-5 minutes)

---

## 📋 Complete Environment Variables Checklist

Make sure you have ALL of these in Render:

- ✅ `EMAIL_HOST` = `smtp.gmail.com`
- ✅ `EMAIL_PORT` = `587`
- ✅ `EMAIL_SECURE` = `false`
- ✅ `EMAIL_USER` = Your Gmail address
- ✅ `EMAIL_PASS` = 16-character App Password (no spaces!)
- ✅ `EMAIL_FROM` = `LevelUp <your.email@gmail.com>`
- ✅ `APP_URL` = Your Render app URL

---

## ✅ Test It!

1. Wait for Render to redeploy (~3-5 minutes)
2. Go to your app's forgot password page
3. Enter **ANY email address** (not just yours!)
4. Check that email's inbox
5. You should receive the password reset email! 🎉

---

## 📝 Important Notes

### Gmail Sending Limits:
- **Free Gmail:** 500 emails/day
- **Google Workspace:** 2,000 emails/day
- More than enough for password resets!

### Security:
- ✅ App Passwords are safer than your actual password
- ✅ Can be revoked anytime without changing your Gmail password
- ✅ Only works for the specific app you created it for

### Emails Will Come From:
- **From:** LevelUp <your.email@gmail.com>
- **Reply-To:** your.email@gmail.com
- Recipients will see your Gmail address

---

## 🔧 Troubleshooting

### "Invalid login" error:
- Make sure you're using the **App Password**, not your regular Gmail password
- App password should be 16 characters with no spaces
- Verify 2FA is enabled on your Gmail account

### "Authentication failed":
- Double-check `EMAIL_USER` matches the Gmail account you created the App Password for
- Make sure there are no extra spaces in `EMAIL_PASS`

### Still not working:
- Check Render logs for specific error messages
- Verify ALL 7 environment variables are set
- Try generating a new App Password

---

## 🚀 Advantages Over Resend

✅ **No domain required** - Works immediately  
✅ **Send to anyone** - No testing restrictions  
✅ **Free** - 500 emails/day is plenty  
✅ **Reliable** - Gmail's infrastructure  
✅ **Easy setup** - Just 3 steps  

---

## 💡 Alternative: Use a Different Gmail

If you don't want to use your personal Gmail:

1. Create a new Gmail account (e.g., `levelup.noreply@gmail.com`)
2. Enable 2FA on the new account
3. Create App Password for the new account
4. Use that in your Render environment variables

This way, emails come from a dedicated account instead of your personal one!

---

**Once you add these variables to Render, password reset will work for ANY email address!** 🎉
