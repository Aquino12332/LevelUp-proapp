# 🔐 Complete Environment Variables Reference

This document lists ALL environment variables needed for your LevelUp app on Render.

---

## 📋 Required Variables (Must Have)

These are REQUIRED for your app to work:

### 1. DATABASE_URL
**What it is**: PostgreSQL database connection string  
**Where to get it**: Neon Console → Your Project → Connection Details  
**Format**:
```
postgresql://username:password@host.region.neon.tech/dbname?sslmode=require
```
**Example**:
```
postgresql://alex:AbCd1234@ep-cool-fire-123456.us-east-2.aws.neon.tech/levelup?sslmode=require
```
**Important Notes**:
- MUST end with `?sslmode=require`
- Keep this secret - never share publicly
- If using Render's PostgreSQL, Render provides this automatically

**How to add in Render**:
1. Go to Environment tab
2. Find `DATABASE_URL` variable
3. Paste your connection string
4. Save changes

---

### 2. SESSION_SECRET
**What it is**: Secret key for encrypting user sessions  
**Where to get it**: Render can auto-generate  
**Format**: Long random string (minimum 32 characters)  
**Example**:
```
a8f5f167f44f4964e6c998dee827110c3f8f167f44f4964e6c998dee827110c
```
**Important Notes**:
- MUST be random and unique
- Never use the example above
- Changing this logs out all users

**How to add in Render**:
1. Go to Environment tab
2. Find `SESSION_SECRET` variable
3. Click "Generate Value" button (recommended)
4. Or paste your own 32+ character random string
5. Save changes

---

### 3. APP_URL
**What it is**: Public URL where your app is accessible  
**Where to get it**: From Render dashboard after service is created  
**Format**: Full HTTPS URL  
**Example**:
```
https://levelup-app.onrender.com
```
**Important Notes**:
- Must start with `https://`
- No trailing slash
- Update if you add a custom domain

**How to add in Render**:
1. After service is created, copy your Render URL from dashboard
2. Go to Environment tab
3. Find `APP_URL` variable
4. Paste your URL
5. Save changes

---

### 4. NODE_ENV
**What it is**: Tells app to run in production mode  
**Value**: `production`  
**Important Notes**:
- Should already be set by render.yaml
- Don't change this

**How to verify in Render**:
1. Go to Environment tab
2. Check `NODE_ENV` = `production`

---

### 5. PORT
**What it is**: Port number Render uses for your app  
**Value**: `10000`  
**Important Notes**:
- Render requires this to be set
- Don't change unless Render documentation says otherwise
- Your app code automatically uses this value

**How to verify in Render**:
1. Go to Environment tab
2. Check `PORT` = `10000`

---

## 🎯 Optional Variables (Recommended Features)

These are OPTIONAL but enable important features:

---

## Google OAuth (Sign in with Google)

### 6. GOOGLE_CLIENT_ID
**What it is**: OAuth client ID from Google  
**Where to get it**: Google Cloud Console  
**Format**: String ending in `.apps.googleusercontent.com`  
**Example**:
```
123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**How to get it**:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project or select existing
3. Enable "Google+ API"
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "OAuth client ID"
6. Application type: "Web application"
7. Name: "LevelUp Production"
8. Authorized redirect URIs: `https://[your-render-url]/api/auth/google/callback`
9. Copy the Client ID shown

---

### 7. GOOGLE_CLIENT_SECRET
**What it is**: OAuth client secret from Google  
**Where to get it**: Google Cloud Console (same place as Client ID)  
**Format**: Random string  
**Example**:
```
GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**How to get it**:
- Shown when you create OAuth client ID
- Or click on your OAuth client to view it
- Keep this secret!

---

### 8. GOOGLE_CALLBACK_URL
**What it is**: URL Google redirects to after authentication  
**Format**: Your Render URL + callback path  
**Example**:
```
https://levelup-app.onrender.com/api/auth/google/callback
```

**How to set it**:
- Must match what you entered in Google Cloud Console
- Format: `https://[your-render-url]/api/auth/google/callback`

---

## Email Configuration (Password Reset & Notifications)

### 9. EMAIL_HOST
**What it is**: SMTP server hostname  
**Common values**:
- Gmail: `smtp.gmail.com`
- SendGrid: `smtp.sendgrid.net`
- Mailgun: `smtp.mailgun.org`
- Amazon SES: `email-smtp.[region].amazonaws.com`

**Example**:
```
smtp.gmail.com
```

---

### 10. EMAIL_PORT
**What it is**: SMTP server port  
**Common values**:
- `587` - TLS (recommended)
- `465` - SSL
- `25` - No encryption (not recommended)

**Example**:
```
587
```

---

### 11. EMAIL_SECURE
**What it is**: Whether to use SSL/TLS  
**Values**:
- `false` - Use STARTTLS on port 587 (recommended)
- `true` - Use SSL on port 465

**Example**:
```
false
```

---

### 12. EMAIL_USER
**What it is**: Email account username  
**Format**: Your email address or username  
**Example** (Gmail):
```
yourapp@gmail.com
```

---

### 13. EMAIL_PASS
**What it is**: Email account password  
**For Gmail**: Use "App Password", not regular password  
**Example**:
```
abcd efgh ijkl mnop
```

**How to get Gmail App Password**:
1. Go to Google Account settings
2. Security → 2-Step Verification (must be enabled)
3. Scroll to "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Name it "LevelUp"
6. Copy the 16-character password shown
7. Paste into Render (no spaces)

---

### 14. EMAIL_FROM
**What it is**: "From" address shown in emails  
**Format**: `"Display Name <email@domain.com>"`  
**Example**:
```
"LevelUp <noreply@levelup.com>"
```

---

## Push Notifications (Browser Notifications)

### 15. VAPID_PUBLIC_KEY
**What it is**: Public key for web push notifications  
**Format**: Base64 string starting with "B"  
**Example**:
```
BMngnidkuzQ0yhhRpL4uEqasMT0AJO0enKGN7TGl2UBFyzr1cLmyaSXBorwVxEhpKih7N7zhQwvA3aVeD6MN9ps
```

**How to generate**:
Run this command on your local machine:
```bash
npx web-push generate-vapid-keys
```
Copy the "Public Key"

---

### 16. VAPID_PRIVATE_KEY
**What it is**: Private key for web push notifications  
**Format**: Base64 string  
**Example**:
```
dVvCOViissFkrNW9uITe6nOu1R1th4Uyq7VXhB4eJFw
```

**How to generate**:
- Same command as above
- Copy the "Private Key"
- Keep this secret!

---

### 17. VAPID_SUBJECT
**What it is**: Contact email for push notification issues  
**Format**: `mailto:your-email@domain.com`  
**Example**:
```
mailto:admin@levelup.com
```

---

## AI Features (Google Gemini)

### 18. GEMINI_API_KEY
**What it is**: API key for Google Gemini AI  
**Where to get it**: Google AI Studio  
**Format**: String starting with "AIza"  
**Example**:
```
AIzaSyAnKD6rcnykq_NXMd55RimeLteY8lKB3p4
```

**How to get it**:
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select or create a Google Cloud project
4. Copy the API key shown
5. Keep this secret!

---

## 📝 Quick Copy Template for Render

Copy this and fill in your values:

```env
# REQUIRED
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require
SESSION_SECRET=[Use Render's "Generate Value" button]
APP_URL=https://your-app-name.onrender.com
NODE_ENV=production
PORT=10000

# OPTIONAL - Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/api/auth/google/callback

# OPTIONAL - Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="LevelUp <noreply@levelup.com>"

# OPTIONAL - Push Notifications
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@levelup.com

# OPTIONAL - AI Features
GEMINI_API_KEY=AIzaSy...your-key
```

---

## 🔍 How to Add Variables in Render Dashboard

### Method 1: During Blueprint Setup
- Render auto-creates variables from render.yaml
- You just need to fill in the values

### Method 2: Manual Addition
1. Go to your service in Render Dashboard
2. Click "Environment" tab in left sidebar
3. Click "Add Environment Variable" button
4. Enter Key (variable name)
5. Enter Value
6. Click "Save Changes"

### Method 3: Bulk Add
1. Click "Add from .env" button
2. Paste your entire .env file content
3. Render parses and adds all variables
4. Review and save

---

## ⚠️ Security Best Practices

- ✅ **DO**: Use Render's "Generate Value" for secrets
- ✅ **DO**: Keep variables in Render dashboard only
- ✅ **DO**: Use Gmail App Passwords, not regular passwords
- ✅ **DO**: Rotate API keys regularly

- ❌ **DON'T**: Commit secrets to Git
- ❌ **DON'T**: Share environment variables publicly
- ❌ **DON'T**: Use the same secrets across environments
- ❌ **DON'T**: Hard-code secrets in your code

---

## 🧪 Testing Variables

After adding variables, test each feature:

| Variable | Test Method |
|----------|-------------|
| DATABASE_URL | Create an account |
| SESSION_SECRET | Log in, refresh page, still logged in |
| APP_URL | Check links in app work correctly |
| GOOGLE_CLIENT_ID | Click "Sign in with Google" |
| EMAIL_* | Click "Forgot Password" |
| VAPID_* | Allow notifications, test alarm |
| GEMINI_API_KEY | Use AI note summary feature |

---

## 📊 Priority Order

Add variables in this order:

1. **DATABASE_URL** - Nothing works without this
2. **SESSION_SECRET** - Required for login
3. **APP_URL** - Required for proper routing
4. **PORT** - Required by Render
5. **NODE_ENV** - Should already be set
6. Google OAuth - If you want social login
7. Email - If you want password reset
8. VAPID - If you want push notifications
9. Gemini - If you want AI features

---

## ❓ FAQ

**Q: Can I leave optional variables blank?**  
A: Yes! The app works without them, but features will be disabled.

**Q: Can I change variables after deployment?**  
A: Yes! Go to Environment tab, edit, save. This triggers a redeploy.

**Q: How do I see which variables are set?**  
A: Environment tab shows all variables (values are hidden for security).

**Q: What if I forget a variable?**  
A: Check Render logs - you'll see error messages indicating missing variables.

**Q: Can I use same variables for multiple environments?**  
A: No! Use different DATABASE_URL, SESSION_SECRET for dev/staging/prod.

---

## 🎓 Learning Resources

- **Render Env Vars Guide**: https://render.com/docs/environment-variables
- **Neon Connection String**: https://neon.tech/docs/connect/connection-string
- **Google OAuth Setup**: https://developers.google.com/identity/protocols/oauth2
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Web Push Setup**: https://web.dev/push-notifications-overview/
- **Google Gemini API**: https://ai.google.dev/tutorials/setup

---

**You now have everything you need!** Copy the values you need and add them to Render. 🚀
