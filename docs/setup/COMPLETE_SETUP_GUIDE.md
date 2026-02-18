# Complete Setup Guide: Neon Database + Google OAuth

This guide will walk you through setting up your LevelUp app with Neon Database and Google Sign-In.

## 🚀 Quick Start (5 Minutes)

### Step 1: Set Up Neon Database (2 minutes)

1. **Create Neon Account**
   - Visit [Neon](https://neon.tech)
   - Sign up for free account
   - Create a new project

2. **Get Connection String**
   - In your Neon dashboard, find "Connection Details"
   - Copy the connection string (looks like):
     ```
     postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
     ```

3. **Create `.env` file**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

4. **Add your Neon URL to `.env`**
   ```env
   DATABASE_URL=postgresql://your-neon-connection-string
   SESSION_SECRET=my-super-secret-key-change-this
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```
   ✅ This creates all tables in your Neon database!

### Step 2: Set Up Google OAuth (3 minutes) - OPTIONAL

1. **Create Google OAuth App**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Configure consent screen (External, add app name "LevelUp")

2. **Configure OAuth Client**
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5000`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
   - Click **Create** and copy credentials

3. **Add to `.env` file**
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

### Step 3: Run Your App

```bash
npm run dev
```

Visit `http://localhost:5000` - You're ready! 🎉

---

## 📋 What You Get

### ✅ Neon Database Features
- **Serverless PostgreSQL** - Auto-scales, no management needed
- **Free tier** - 0.5GB storage, perfect for getting started
- **Automatic backups** - Your data is safe
- **Fast connections** - Edge network for low latency
- **Git-like branching** - Create dev/staging/prod databases

### ✅ Authentication Features
- **Traditional Login** - Username + password
- **Google Sign-In** - One-click login with Gmail
- **Session Management** - Secure, persistent sessions
- **User Profiles** - Avatar, email, username
- **Automatic Account Creation** - First-time Google users get instant accounts

---

## 🗂️ Database Schema

Your app has these tables (automatically created):

### `users` - User accounts
- `id`, `username`, `password` (nullable for OAuth)
- `email`, `provider` (local/google), `providerId`
- `avatar`, `createdAt`

### `userStats` - Gamification data
- `level`, `xp`, `coins`, `streak`
- `totalStudyTime`, `tasksCompleted`
- `name`, `age`, `gender`

### Other Tables
- `tasks` - Todo items and assignments
- `notes` - User notes
- `alarms` - Wake-up alarms
- `focusSessions` - Pomodoro sessions
- `shopItems` - In-app store items
- `userInventory` - Purchased items
- `friendships` & `friendRequests` - Social features

---

## 🔐 Authentication Flow

### Traditional Sign-Up/Login:
```
User → Enter username/password → Server validates → Session created → Dashboard
```

### Google Sign-In:
```
User → Click "Continue with Google" 
     → Google auth page 
     → User approves 
     → Server receives profile 
     → Account created/linked 
     → Session created 
     → Dashboard
```

---

## 🌐 Production Deployment

### For Replit:
1. Add Secrets (left sidebar):
   - `DATABASE_URL` = Your Neon connection string
   - `SESSION_SECRET` = Random secret key
   - `GOOGLE_CLIENT_ID` = Your Google client ID
   - `GOOGLE_CLIENT_SECRET` = Your Google secret
   - `GOOGLE_CALLBACK_URL` = `https://your-repl.replit.dev/api/auth/google/callback`

2. Update Google Console:
   - Add `https://your-repl.replit.dev` to authorized origins
   - Add `https://your-repl.replit.dev/api/auth/google/callback` to redirect URIs

3. Click **Run** - Done! ✅

### For Other Platforms (Vercel, Railway, etc.):
1. Set environment variables in platform dashboard
2. Update Google OAuth settings with production URL
3. Deploy!

---

## 🧪 Testing Your Setup

### Test Database Connection:
```bash
npm run dev
```
Look for: `serving on port 5000` (no database errors)

### Test Traditional Auth:
1. Go to `/signin`
2. Click **Register** tab
3. Create account with username/password
4. Should redirect to dashboard ✅

### Test Google OAuth:
1. Go to `/signin`
2. Click **"Continue with Google"** button
3. Sign in with Google account
4. Should redirect to dashboard ✅
5. Check profile - should show your Google avatar

### Verify Database:
1. Go to Neon dashboard
2. Open SQL Editor
3. Run: `SELECT * FROM users;`
4. You should see your user account! ✅

---

## 🛠️ Troubleshooting

### Database Connection Issues:
**Error:** "DATABASE_URL, ensure the database is provisioned"
- **Fix:** Add `DATABASE_URL` to `.env` file with your Neon connection string

**Error:** "Connection timeout"
- **Fix:** Check if your IP is allowed (Neon free tier allows all IPs)
- **Fix:** Verify connection string has `?sslmode=require` at the end

### Google OAuth Issues:
**Error:** "Redirect URI mismatch"
- **Fix:** URLs in `.env` must exactly match Google Console
- **Fix:** Don't include trailing slashes
- **Fix:** Use correct protocol (http:// locally, https:// in production)

**Google button doesn't show:**
- **Fix:** Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are in `.env`
- **Fix:** Restart your dev server after adding env variables

**"Not authenticated" after Google sign-in:**
- **Fix:** Clear browser cookies
- **Fix:** Check `SESSION_SECRET` is set in `.env`
- **Fix:** Check server console for errors

### General Issues:
**Port already in use:**
```bash
# Kill process on port 5000
npx kill-port 5000
npm run dev
```

**Schema changes not applying:**
```bash
npm run db:push
```

---

## 📚 File Changes Made

### New Files:
- `NEON_SETUP.md` - Neon database setup guide
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth setup guide
- `COMPLETE_SETUP_GUIDE.md` - This file
- `.env.example` - Environment variables template

### Modified Files:
- `shared/schema.ts` - Added OAuth fields to users table
- `server/routes.ts` - Added Google OAuth routes and Passport config
- `server/storage.ts` - Added OAuth helper methods
- `client/src/pages/SignIn.tsx` - Added Google sign-in buttons
- `package.json` - Added Google OAuth dependencies

---

## 🎯 Next Steps

1. **Customize Google button styling** - Match your brand colors
2. **Add more OAuth providers** - Facebook, GitHub, Twitter
3. **Add email verification** - For local accounts
4. **Add password reset** - For local accounts
5. **Add profile editing** - Let users update their info
6. **Deploy to production** - Share your app with the world!

---

## 💡 Pro Tips

- **Development:** Use local accounts for quick testing
- **Production:** Encourage Google sign-in for better UX
- **Database:** Use Neon's branching feature for testing schema changes
- **Security:** Never commit `.env` file to Git (already in `.gitignore`)
- **Performance:** Neon automatically scales with your user base

---

## 🆘 Need Help?

- **Neon Docs:** https://neon.tech/docs
- **Passport.js Docs:** http://www.passportjs.org/docs/
- **Google OAuth Guide:** https://developers.google.com/identity/protocols/oauth2

---

## ✨ Your app now supports:
✅ Neon PostgreSQL database  
✅ Google OAuth sign-in  
✅ Traditional username/password auth  
✅ Secure session management  
✅ User profiles with avatars  
✅ Automatic account creation  
✅ Production-ready setup  

**Happy coding! 🚀**
