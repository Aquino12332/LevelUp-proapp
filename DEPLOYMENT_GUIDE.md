# 🚀 Deployment Guide - LevelUp App

Complete guide for deploying your LevelUp productivity app to production.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✅
- [ ] Neon PostgreSQL database created
- [ ] `DATABASE_URL` environment variable configured
- [ ] Database schema pushed: `npm run db:push`
- [ ] Test database connection

### 2. Environment Variables ✅
Required for production:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Session Secret (REQUIRED - Generate a strong random string)
SESSION_SECRET=your-very-long-random-secret-key-min-32-chars

# App Configuration (REQUIRED)
APP_URL=https://your-domain.com
NODE_ENV=production
PORT=5000

# Push Notifications (Generate new keys for production)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

# Email (Optional - for Password Reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="LevelUp <noreply@yourapp.com>"

# Google Gemini AI (Optional - for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Security Hardening 🔒
- [ ] Generate new `SESSION_SECRET` (min 32 chars, random)
- [ ] Generate new VAPID keys for push notifications
- [ ] Update `GOOGLE_CALLBACK_URL` to production domain
- [ ] Update `APP_URL` to production domain
- [ ] Remove any test/debug API keys
- [ ] Review and update CORS settings if needed

---

## 🎯 Deployment Platforms

### Option 1: Vercel (Recommended - Easy & Free Tier)

**Pros:** Free tier, automatic HTTPS, easy deployment, serverless
**Cons:** Serverless functions have execution time limits

#### Steps:

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`** (in project root):
   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install",
     "devCommand": "npm run dev",
     "framework": null,
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   # Follow the prompts
   # Add environment variables in Vercel dashboard
   ```

4. **Configure Environment Variables:**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required env vars from the checklist above

---

### Option 2: Railway (Recommended - Full Server)

**Pros:** Full server environment, PostgreSQL included, easy deployment
**Cons:** Paid after free trial ($5/month)

#### Steps:

1. **Sign up at [Railway.app](https://railway.app/)**

2. **Create New Project:**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Connect your GitHub repository

3. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide a `DATABASE_URL` automatically

4. **Configure Environment Variables:**
   - Go to your service → Variables tab
   - Add all required env vars

5. **Deploy:**
   - Railway automatically deploys on git push
   - Get your deployment URL from Railway dashboard

---

### Option 3: Render (Good Balance)

**Pros:** Free tier, PostgreSQL included, full server
**Cons:** Free tier has slower cold starts

#### Steps:

1. **Sign up at [Render.com](https://render.com/)**

2. **Create Web Service:**
   - New → Web Service
   - Connect GitHub repository

3. **Configure Build:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Add PostgreSQL:**
   - New → PostgreSQL
   - Copy `DATABASE_URL` to environment variables

5. **Add Environment Variables:**
   - Go to Environment tab
   - Add all required vars

---

### Option 4: DigitalOcean App Platform

**Pros:** Managed hosting, good performance, $5/month
**Cons:** No free tier

#### Steps:

1. **Sign up at [DigitalOcean](https://www.digitalocean.com/)**

2. **Create App:**
   - Apps → Create App
   - Connect GitHub

3. **Configure:**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `5000`

4. **Add Managed Database:**
   - Add PostgreSQL database
   - Use connection string as `DATABASE_URL`

---

### Option 5: Docker + Any VPS

**Pros:** Full control, can deploy anywhere
**Cons:** More setup, manual SSL management

#### Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]
```

#### .dockerignore:
```
node_modules
dist
.env
.git
*.md
tmp_*
.local
```

#### Deploy:
```bash
# Build image
docker build -t levelup-app .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="your-database-url" \
  -e SESSION_SECRET="your-secret" \
  --name levelup \
  levelup-app
```

---

## 🔧 Build Process

### Build the app:
```bash
npm run build
```

This will:
1. Build the React frontend with Vite
2. Bundle the Express backend with esbuild
3. Output to `dist/` directory

### Test production build locally:
```bash
npm run build
npm start
```

Then visit: `http://localhost:5000`

---

## 🗄️ Database Migration

### Push schema to production database:
```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Push schema
npm run db:push
```

### Seed shop items (optional):
The app automatically seeds shop items on first startup.

---

## 🔐 Generate VAPID Keys (Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Add the output to your environment variables.

---

## 📊 Post-Deployment Testing

- [ ] Test user registration and login
- [ ] Test alarm creation and triggering
- [ ] Test push notifications (if enabled)
- [ ] Test task creation and management
- [ ] Test focus mode features
- [ ] Test shop system
- [ ] Test social features (friends)
- [ ] Test offline functionality
- [ ] Check browser console for errors
- [ ] Test on mobile devices

---

## 🔍 Monitoring & Maintenance

### Health Checks:
- API: `https://your-domain.com/api/health` (you may need to add this)
- Database connection: Check logs on startup

### Logs:
- Check your platform's logging dashboard
- Look for connection errors, alarm checker status
- Monitor database query performance

### Scaling:
- **Database:** Neon scales automatically on free tier (up to 200 users)
- **Server:** Increase server resources if needed
- **Connection Pool:** Adjust `max` in `db/index.ts` (currently 20)

---

## 🐛 Common Issues

### 1. "ECONNREFUSED" Database Errors
**Solution:** Neon database waking up. This is normal - retries are built-in.

### 2. Alarms Not Triggering
**Solution:** 
- Check alarm checker is running (see logs)
- Verify push notification keys are set
- Check browser console for client-side errors

### 3. Session Not Persisting
**Solution:** 
- Verify `SESSION_SECRET` is set
- Check if cookies are enabled
- For production, use PostgreSQL session store (already configured)

### 4. Build Fails
**Solution:**
- Run `npm ci` to clean install dependencies
- Check Node.js version (requires v20+)
- Verify all environment variables are set

---

## 📱 PWA & Mobile

The app is already configured as a PWA:
- ✅ Service worker registered
- ✅ Manifest.json configured
- ✅ Offline support enabled
- ✅ Mobile-optimized UI

Users can "Add to Home Screen" on mobile devices for app-like experience.

---

## 🎉 You're Ready!

Choose your deployment platform and follow the steps above. Your LevelUp app will be live in minutes!

**Recommended for beginners:** Start with **Vercel** or **Railway** for the easiest deployment experience.

**Need help?** Check the remaining guide files:
- `COMPLETE_SETUP_GUIDE.md` - Initial setup
- `ENV_REQUIREMENTS.md` - Environment variables explained
- `DATABASE_LIMITS.md` - Database optimization tips

---

**Good luck with your deployment! 🚀**
