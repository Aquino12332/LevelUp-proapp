# 🎯 Step-by-Step Render Deployment Checklist

Follow these steps in order. Check off each one as you complete it.

---

## ✅ PHASE 1: Pre-Deployment Setup (5 minutes)

### Step 1: Create Render Account
- [ ] Go to [render.com](https://render.com)
- [ ] Click "Get Started" or "Sign Up"
- [ ] Sign up with GitHub (recommended) or email
- [ ] Verify your email if needed

### Step 2: Prepare Your Git Repository
- [ ] Ensure all code is committed:
  ```bash
  git status
  # If you have uncommitted changes:
  git add .
  git commit -m "Prepare for Render deployment"
  ```

- [ ] Push to GitHub/GitLab:
  ```bash
  git push origin main
  # Or if your branch is 'master':
  git push origin master
  ```

- [ ] Verify files are pushed:
  - `render.yaml` ✓
  - `Dockerfile` ✓
  - `package.json` ✓
  - All source code ✓

---

## ✅ PHASE 2: Get Your Environment Variables Ready (10 minutes)

### Step 3: Get Database URL (Neon PostgreSQL)

**If you already have a Neon database:**
- [ ] Go to [console.neon.tech](https://console.neon.tech)
- [ ] Log in to your account
- [ ] Select your project
- [ ] Click "Connection Details"
- [ ] Copy the connection string (looks like this):
  ```
  postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
  ```
- [ ] **IMPORTANT**: Make sure it ends with `?sslmode=require`
- [ ] Save this - you'll need it soon!

**If you DON'T have a Neon database yet:**
- [ ] Go to [neon.tech](https://neon.tech)
- [ ] Sign up for free account
- [ ] Create a new project
- [ ] Name it "levelup" (or whatever you prefer)
- [ ] Select region closest to your users
- [ ] Copy the connection string provided
- [ ] Save this connection string!

### Step 4: Prepare Other Environment Variables

**Required Variables (copy this template):**

```bash
# Required - Must have these
DATABASE_URL=postgresql://[PASTE YOUR NEON URL HERE]
SESSION_SECRET=[LEAVE BLANK - Render will auto-generate]
APP_URL=[LEAVE BLANK - Will update after deployment]
NODE_ENV=production
PORT=10000
```

**Optional Variables (only if you want these features):**

```bash
# Google OAuth (for "Sign in with Google")
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=[LEAVE BLANK - Will update after deployment]

# Email (for password reset emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="LevelUp <noreply@yourapp.com>"

# Push Notifications
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# AI Features (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key
```

- [ ] Copy this template to a text file on your computer
- [ ] Fill in the DATABASE_URL with your Neon connection string
- [ ] Keep this file handy - you'll paste these into Render

---

## ✅ PHASE 3: Deploy to Render (10 minutes)

### Step 5: Create Web Service on Render

- [ ] Go to [dashboard.render.com](https://dashboard.render.com)
- [ ] Click the big blue **"New +"** button in the top right
- [ ] Select **"Blueprint"** from the dropdown menu

### Step 6: Connect Your Repository

- [ ] Click **"Connect a repository"**
- [ ] If first time: Click **"Configure account"** to connect GitHub/GitLab
  - Authorize Render to access your repositories
  - You can choose "All repositories" or "Only select repositories"
- [ ] Find your repository in the list
- [ ] Click **"Connect"**

### Step 7: Configure Blueprint

- [ ] Render will detect your `render.yaml` file
- [ ] You'll see a preview showing:
  - **Service name**: levelup-app
  - **Type**: Web Service
  - **Environment**: Docker
- [ ] Review the configuration
- [ ] Click **"Apply"** button

### Step 8: Wait for Initial Setup (2-3 minutes)

- [ ] Render will create your service
- [ ] You'll see "Creating service..." message
- [ ] Wait until you see your service dashboard
- [ ] **DO NOT WAIT FOR BUILD** - it will fail first time (we need to add environment variables)

---

## ✅ PHASE 4: Configure Environment Variables (5 minutes)

### Step 9: Add Environment Variables

- [ ] In your service dashboard, click **"Environment"** tab in the left sidebar
- [ ] You'll see a list of environment variables

**Now add/update these variables:**

#### Required Variables:

1. **DATABASE_URL**
   - [ ] Click on the `DATABASE_URL` variable
   - [ ] Delete the placeholder value
   - [ ] Paste your Neon PostgreSQL connection string
   - [ ] Click "Save Changes"

2. **SESSION_SECRET**
   - [ ] Click on `SESSION_SECRET` variable
   - [ ] Click **"Generate Value"** button (Render creates a secure random string)
   - [ ] Click "Save Changes"

3. **APP_URL**
   - [ ] Look at the top of your dashboard for your Render URL
   - [ ] It will look like: `https://levelup-app.onrender.com` or `https://levelup-app-xxxx.onrender.com`
   - [ ] Copy this URL
   - [ ] Click on `APP_URL` variable
   - [ ] Paste your Render URL
   - [ ] Click "Save Changes"

4. **PORT**
   - [ ] Should already be set to `10000`
   - [ ] If not, click "Add Environment Variable"
   - [ ] Key: `PORT`
   - [ ] Value: `10000`
   - [ ] Click "Save"

5. **NODE_ENV**
   - [ ] Should already be set to `production`
   - [ ] Verify it's correct

#### Optional Variables (if you want these features):

**For Google OAuth:**
- [ ] Click "Add Environment Variable"
- [ ] Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- [ ] Update `GOOGLE_CALLBACK_URL` to: `https://[your-render-url]/api/auth/google/callback`

**For Email:**
- [ ] Add `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

**For Push Notifications:**
- [ ] Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

**For AI Features:**
- [ ] Add `GEMINI_API_KEY`

### Step 10: Save and Trigger Deploy

- [ ] After adding all variables, look for **"Save Changes"** button at the top
- [ ] Click **"Save Changes"**
- [ ] This will automatically trigger a new deployment

---

## ✅ PHASE 5: Monitor Deployment (5-10 minutes)

### Step 11: Watch the Build Process

- [ ] Click **"Logs"** tab in the left sidebar
- [ ] You'll see real-time logs of your deployment
- [ ] Watch for these stages:
  1. **Building** (3-5 minutes)
     - Pulling Docker image
     - Installing dependencies
     - Building your app
  2. **Deploying** (1-2 minutes)
     - Starting your service
     - Running health checks
  3. **Live** ✓
     - "serving on port 10000" message appears
     - Service shows as "Live" with green dot

### Step 12: Check for Errors

**If build succeeds:**
- [ ] You'll see green "Live" status
- [ ] Logs show "serving on port 10000"
- [ ] ✅ Success! Move to Phase 6

**If build fails:**
- [ ] Read the error message in logs
- [ ] Common issues:
  - **DATABASE_URL error**: Check your connection string format
  - **Port error**: Verify PORT=10000 is set
  - **Build timeout**: Try "Clear build cache & retry" button
- [ ] After fixing, click **"Manual Deploy"** → "Deploy latest commit"

---

## ✅ PHASE 6: Test Your Deployment (5 minutes)

### Step 13: Visit Your App

- [ ] Copy your Render URL from the dashboard
- [ ] Open in a new browser tab
- [ ] Wait 30-60 seconds for first load (database connection)

### Step 14: Test Basic Features

- [ ] **Homepage loads**: You see the LevelUp interface ✓
- [ ] **Sign Up**: Create a new account
  - [ ] Enter username, email, password
  - [ ] Click "Sign Up"
  - [ ] You should be logged in
- [ ] **Database works**: Your account was created ✓
- [ ] **Dashboard loads**: You can see your dashboard
- [ ] **Create a task**: Add a test task
  - [ ] Task saves successfully ✓

### Step 15: Test Optional Features (if configured)

**If you set up Google OAuth:**
- [ ] Click "Sign in with Google"
- [ ] Complete Google sign-in flow
- [ ] You're logged in ✓

**If you set up Email:**
- [ ] Try "Forgot Password"
- [ ] Check if email arrives
- [ ] Email works ✓

**If you set up Push Notifications:**
- [ ] Browser asks for notification permission
- [ ] Click "Allow"
- [ ] Notifications work ✓

---

## ✅ PHASE 7: Post-Deployment Setup (5 minutes)

### Step 16: Initialize Database Schema

- [ ] In Render dashboard, go to **"Shell"** tab
- [ ] Click **"Launch Shell"**
- [ ] Run this command:
  ```bash
  npm run db:push
  ```
- [ ] Wait for "Schema pushed successfully" message
- [ ] Type `exit` to close shell

### Step 17: Update Google OAuth Callback (if using)

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Select your project
- [ ] Go to **APIs & Services** → **Credentials**
- [ ] Click on your OAuth 2.0 Client ID
- [ ] Under "Authorized redirect URIs", click **"+ ADD URI"**
- [ ] Add: `https://[your-render-url]/api/auth/google/callback`
- [ ] Click **"Save"**
- [ ] Test Google sign-in again to verify ✓

### Step 18: Set Up Custom Domain (Optional)

- [ ] In Render dashboard, click **"Settings"** tab
- [ ] Scroll to **"Custom Domain"** section
- [ ] Click **"Add Custom Domain"**
- [ ] Enter your domain (e.g., `app.yourdomain.com`)
- [ ] Follow DNS instructions provided
- [ ] Wait for SSL certificate to be issued (automatic)
- [ ] Update `APP_URL` environment variable to your custom domain

---

## ✅ PHASE 8: Final Verification (2 minutes)

### Step 19: Final Checks

- [ ] App is accessible at your Render URL ✓
- [ ] No errors in Render logs
- [ ] Database connection is stable
- [ ] User authentication works
- [ ] Tasks can be created and saved
- [ ] All features you configured are working

### Step 20: Set Up Monitoring

- [ ] In Render dashboard, go to **"Metrics"** tab
- [ ] Review CPU and memory usage
- [ ] In **"Settings"** → **"Notifications"**
  - [ ] Enable email notifications for:
    - Deploy failures
    - Service downtime
  - [ ] Add your email address

---

## 🎉 DEPLOYMENT COMPLETE!

### Your App Info:
- **URL**: `https://your-app-name.onrender.com`
- **Status**: Live ✓
- **Database**: Neon PostgreSQL
- **Auto-deploy**: Enabled (pushes to main branch trigger deployment)

### Important URLs:
- **App Dashboard**: Your Render URL
- **Render Dashboard**: https://dashboard.render.com
- **Logs**: Render Dashboard → Your Service → Logs
- **Database**: https://console.neon.tech

---

## 🚨 Troubleshooting Quick Reference

### Problem: "Application failed to respond"
**Solution:**
- Check Logs tab for error messages
- Verify DATABASE_URL is correct
- Ensure PORT=10000 is set

### Problem: "Build failed"
**Solution:**
- Click "Clear build cache & retry"
- Check that all files are committed to Git
- Verify Dockerfile is correct

### Problem: "Database connection error"
**Solution:**
- Check DATABASE_URL format
- Ensure `?sslmode=require` is at the end
- Verify Neon database is active (free tier may sleep)

### Problem: "Can't log in / Sessions not working"
**Solution:**
- Verify SESSION_SECRET is set
- Check APP_URL matches your actual Render URL
- Clear browser cookies and try again

### Problem: App is slow to wake up
**Solution:**
- This is normal on free tier (sleeps after 15 min inactivity)
- First request takes ~30 seconds to wake up
- Upgrade to Starter plan ($7/mo) for always-on service

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Render Status**: https://status.render.com
- **Neon Docs**: https://neon.tech/docs

---

## 🔄 Making Updates After Deployment

Every time you push code changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render automatically:
1. Detects the push
2. Builds your Docker image
3. Runs tests/health checks
4. Deploys with zero downtime (paid plans)
5. Sends you a notification

---

**Congratulations! Your LevelUp app is now live on Render!** 🚀

Share your app URL: `https://your-app-name.onrender.com`
