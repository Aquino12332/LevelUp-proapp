# ✅ Pre-Deployment Checklist

Use this checklist before deploying to production.

---

## 🔐 Security

- [ ] Generate new `SESSION_SECRET` (min 32 chars)
  ```bash
  openssl rand -base64 32
  ```

- [ ] Generate new VAPID keys for push notifications
  ```bash
  npx web-push generate-vapid-keys
  ```

- [ ] Update `APP_URL` to production domain
- [ ] Update `GOOGLE_CALLBACK_URL` to production domain (if using OAuth)
- [ ] Remove any test/debug API keys from `.env`
- [ ] Verify `.env` is in `.gitignore` (don't commit secrets!)

---

## 🗄️ Database

- [ ] Neon PostgreSQL database created
- [ ] `DATABASE_URL` copied to environment variables
- [ ] Database schema pushed to production:
  ```bash
  npm run db:push
  ```
- [ ] Test database connection

---

## 🔧 Build & Test

- [ ] Run production build locally:
  ```bash
  npm run build
  npm start
  ```

- [ ] Test in browser at `http://localhost:5000`
- [ ] Verify all features work:
  - [ ] User registration/login
  - [ ] Alarms
  - [ ] Tasks
  - [ ] Focus mode
  - [ ] Shop system
  - [ ] Offline functionality

---

## 🌐 Environment Variables

Set these on your deployment platform:

### Required
- [ ] `DATABASE_URL`
- [ ] `SESSION_SECRET`
- [ ] `APP_URL`
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`
- [ ] `VAPID_SUBJECT`

### Optional (but recommended)
- [ ] `GOOGLE_CLIENT_ID` (for Google Sign-In)
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL`
- [ ] `EMAIL_HOST` (for password reset)
- [ ] `EMAIL_PORT`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASS`
- [ ] `EMAIL_FROM`
- [ ] `GEMINI_API_KEY` (for AI features)

---

## 📦 Deployment Files

- [ ] `Dockerfile` created (for Docker deployments)
- [ ] `.dockerignore` created
- [ ] `vercel.json` created (for Vercel)
- [ ] `.env.production.example` created (template)

---

## 🚀 Platform-Specific

### Vercel
- [ ] Connect GitHub repository
- [ ] Add environment variables in dashboard
- [ ] Deploy

### Railway
- [ ] Connect GitHub repository
- [ ] Add PostgreSQL database
- [ ] Add environment variables
- [ ] Deploy

### Render
- [ ] Create Web Service
- [ ] Create PostgreSQL database
- [ ] Add environment variables
- [ ] Set build command: `npm run build`
- [ ] Set start command: `npm start`

### Docker/VPS
- [ ] Build Docker image
- [ ] Configure reverse proxy (nginx/caddy)
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure firewall
- [ ] Set up monitoring

---

## 📱 Post-Deployment

- [ ] Test user registration
- [ ] Test login
- [ ] Create an alarm and verify it triggers
- [ ] Test push notifications
- [ ] Test on mobile device
- [ ] Add app to home screen (PWA)
- [ ] Check browser console for errors
- [ ] Monitor server logs
- [ ] Set up uptime monitoring (optional)

---

## 🎉 Ready to Deploy!

Once all checkboxes are complete, you're ready to go live!

**Choose your platform:**
- **Easy:** Vercel or Railway (recommended for beginners)
- **Full Control:** Docker + VPS
- **Balanced:** Render or DigitalOcean

See `DEPLOYMENT_GUIDE.md` for detailed platform-specific instructions.

---

**Good luck! 🚀**
