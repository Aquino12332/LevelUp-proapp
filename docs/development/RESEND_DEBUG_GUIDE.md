# 🔍 Resend Email Debug Guide

You've added `RESEND_API_KEY` but emails aren't arriving. Follow these steps to debug:

---

## Step 1: Check Render Logs (MOST IMPORTANT)

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click on your **levelup-app** service
3. Click **"Logs"** tab (left sidebar)
4. **Trigger a password reset** from your app
5. Watch the logs in real-time

**Look for these messages:**

### ✅ Success Message:
```
✅ Email sent via Resend to youremail@gmail.com: <email-id>
```
If you see this → Email was sent successfully! Check spam folder.

### ❌ Error Messages:

**Error 1: API Key Invalid**
```
❌ Resend API error: {"message":"Invalid API key"}
```
**Fix:** Double-check your `RESEND_API_KEY` in Render environment variables.

**Error 2: Missing Required Fields**
```
❌ Resend API error: {"message":"Missing required parameter: from"}
```
**Fix:** This shouldn't happen, but check if APP_URL is set.

**Error 3: Rate Limit**
```
❌ Resend API error: {"message":"Rate limit exceeded"}
```
**Fix:** Wait a few minutes, free tier has limits.

---

## Step 2: Verify Environment Variables in Render

**Required Variables:**
- ✅ `RESEND_API_KEY` = `re_YourActualKey`
- ✅ `APP_URL` = `https://yourapp-abc123.onrender.com`

**How to check:**
1. Render Dashboard → Your Service
2. Click **"Environment"** tab
3. Look for both variables
4. Make sure APP_URL matches your actual Render URL

**If APP_URL is missing:**
1. Click "Add Environment Variable"
2. Key: `APP_URL`
3. Value: Your Render app URL (e.g., `https://levelup-app-9y1z.onrender.com`)
4. Click "Save Changes"

---

## Step 3: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. Log in to your Resend account
3. Look for recent email attempts
4. Click on any email to see:
   - Delivery status
   - Error messages
   - Recipient info

**If no emails appear:** The API call isn't reaching Resend (check logs in Step 1)

---

## Step 4: Check Spam/Junk Folder

- Emails from `onboarding@resend.dev` might go to spam initially
- Check **All Mail**, **Spam**, **Junk**, **Promotions** tabs
- Add `onboarding@resend.dev` to contacts to prevent future spam filtering

---

## Step 5: Test with Different Email

Try password reset with:
- Gmail account
- Different email provider
- A disposable email (temp-mail.org)

This helps identify if it's an email provider filtering issue.

---

## Step 6: Verify Resend API Key is Active

1. Go to: https://resend.com/api-keys
2. Find your API key
3. Make sure it's:
   - ✅ Active (not revoked)
   - ✅ Has correct permissions
   - ✅ Copy it again and update in Render (just in case)

---

## Quick Debug Checklist

Copy this and check off each item:

```
[ ] Render logs show "✅ Email sent via Resend"
[ ] RESEND_API_KEY is set in Render environment
[ ] APP_URL is set in Render environment (e.g., https://yourapp.onrender.com)
[ ] API key starts with "re_"
[ ] Checked spam/junk folder
[ ] Checked Resend dashboard (resend.com/emails)
[ ] Tried with different email address
[ ] API key is active in Resend dashboard
```

---

## Still Not Working?

**Share with me:**
1. Screenshot or text of Render logs when you trigger password reset
2. What you see in Resend dashboard (resend.com/emails)
3. Any error messages from the app

I'll help you fix it! 🚀
