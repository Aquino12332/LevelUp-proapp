# 🔐 Google OAuth Setup - Step by Step

## Overview
This guide will help you enable "Sign in with Google" for your app.

**Time required:** 10-15 minutes  
**Cost:** FREE  
**What you need:** A Google account

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Google Cloud Console (2 minutes)

1. Open your browser
2. Go to: **https://console.cloud.google.com**
3. Sign in with your Google account
4. Accept terms of service if prompted

---

### Step 2: Create a New Project (1 minute)

1. Click the **project dropdown** at the top (says "Select a project")
2. Click **"New Project"** button
3. **Project Name:** Type "LevelUp App" (or any name you want)
4. **Organization:** Leave as "No organization"
5. Click **"Create"** button
6. Wait for the project to be created (takes ~10 seconds)

---

### Step 3: Enable Google+ API (2 minutes)

1. Make sure your new project is selected (check top bar)
2. Click the **hamburger menu** (☰) in top left
3. Go to: **"APIs & Services"** → **"Library"**
4. In the search box, type: **"Google+ API"**
5. Click on **"Google+ API"**
6. Click the **"Enable"** button
7. Wait for it to enable (~5 seconds)

---

### Step 4: Configure OAuth Consent Screen (3 minutes)

1. Click hamburger menu (☰) → **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (allows anyone to sign in)
3. Click **"Create"** button

**Fill in the form:**

- **App name:** `LevelUp` (or your app name)
- **User support email:** Select your email from dropdown
- **App logo:** Skip for now (optional)
- **App domain:** Leave blank for now
- **Authorized domains:** Leave blank for now
- **Developer contact email:** Type your email address

4. Click **"Save and Continue"**

**Scopes page:**
- Click **"Add or Remove Scopes"**
- Check these boxes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Click **"Update"** at bottom
- Click **"Save and Continue"**

**Test users page:**
- Click **"Add Users"**
- Add your email (for testing)
- Click **"Add"**
- Click **"Save and Continue"**

**Summary page:**
- Review and click **"Back to Dashboard"**

---

### Step 5: Create OAuth Credentials (3 minutes)

1. Click hamburger menu (☰) → **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** at top
3. Select **"OAuth client ID"**

**Configure OAuth client:**

- **Application type:** Select **"Web application"**
- **Name:** Type "LevelUp Web Client"

**Authorized JavaScript origins:**
- Click **"Add URI"**
- Type: `http://localhost:5000`
- Click **"Add URI"** again
- Type: `http://localhost:5001` (backup port)

**Authorized redirect URIs:**
- Click **"Add URI"**
- Type: `http://localhost:5000/api/auth/google/callback`
- Click **"Add URI"** again  
- Type: `http://localhost:5001/api/auth/google/callback` (backup)

4. Click **"Create"** button

---

### Step 6: Copy Your Credentials (1 minute)

After clicking Create, you'll see a popup with:

- **Your Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
- **Your Client Secret** (looks like: `GOCSPX-abc123xyz789`)

**Copy both of these!** You'll need them in the next step.

---

### Step 7: Update Your .env File (1 minute)

Now I'll update your `.env` file with these credentials.

**Tell me:**
- Your Client ID
- Your Client Secret

**Format:** Just paste them like this:
```
Client ID: 123456789-abc123.apps.googleusercontent.com
Client Secret: GOCSPX-abc123xyz789
```

---

## 📸 What You'll See (Visual Guide)

### Google Cloud Console Home
- Top bar with project selector
- Hamburger menu (☰) on left
- "Select a project" dropdown

### APIs & Services → Library
- Search bar at top
- Grid of API cards
- "Google+ API" in results

### OAuth Consent Screen
- "External" vs "Internal" radio buttons
- Form with app details
- Scopes selection page

### Credentials Page
- "Create Credentials" button at top
- List of existing credentials below
- Shows Client IDs and API keys

### OAuth Client Created Popup
- Shows Client ID (long string)
- Shows Client Secret (shorter string)
- "Download JSON" option (not needed)

---

## ✅ Checklist

- [ ] Went to console.cloud.google.com
- [ ] Created new project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen (External)
- [ ] Added scopes (email, profile)
- [ ] Created OAuth Client ID (Web application)
- [ ] Added authorized origins (localhost:5000)
- [ ] Added redirect URIs (localhost:5000/api/auth/google/callback)
- [ ] Copied Client ID
- [ ] Copied Client Secret
- [ ] Ready to update .env file

---

## 🐛 Common Issues

### "Can't find Google+ API"
- Try searching for "Google Identity" instead
- Or just proceed - it might work without enabling it

### "OAuth consent screen asks for verification"
- Don't worry! For testing, you don't need verification
- Click "Continue" or "Test mode"

### "Need to add test users"
- Add your own email address
- You can test with your account even without verification

---

## 🆘 Need Help?

Tell me which step you're on:
- "I'm stuck on Step X"
- "I can't find [something]"
- "I see [error message]"

I'll help you through it!

---

## 🎯 After Setup

Once you give me your Client ID and Secret:
1. I'll update your .env file
2. You'll restart your app
3. You'll see "Sign in with Google" button
4. It will work! 🎉
