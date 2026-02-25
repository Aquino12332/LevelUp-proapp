# 🔧 Environment Variables - Complete Reference

## Quick Overview

**Total Variables:** 10 (8 Required + 2 Optional)

---

## 📊 Complete Variables Table

| Variable | Type | Default | Description | Where Used | How to Get |
|----------|------|---------|-------------|------------|------------|
| **DATABASE_URL** | Required | - | PostgreSQL connection string | `server/storage.ts`, `db/index.ts` | [Neon.tech](https://neon.tech) free tier |
| **SESSION_SECRET** | Required | - | Secret key for encrypting user sessions | `server/routes.ts` | `openssl rand -base64 32` |
| **ADMIN_SECRET** | Required | - | Password for admin dashboard access | `server/routes.ts`, `server/admin-middleware.ts` | Choose a strong password |
| **NODE_ENV** | Required | `development` | Environment mode (development/production) | Multiple files | `development` or `production` |
| **PORT** | Required | `5000` | Server port number | `server/index.ts` | Any available port (default: 5000) |
| **VAPID_PUBLIC_KEY** | Required | - | Public key for push notifications | `server/push.ts`, `client/src/lib/push.ts` | `npx web-push generate-vapid-keys` |
| **VAPID_PRIVATE_KEY** | Required | - | Private key for push notifications | `server/push.ts` | `npx web-push generate-vapid-keys` |
| **VAPID_SUBJECT** | Required | - | Contact email for push notifications | `server/push.ts` | `mailto:your-email@example.com` |
| **GROQ_API_KEY** | Optional | - | API key for AI-powered note summaries | `server/ai.ts` | [Groq Console](https://console.groq.com) - Free tier available |

---

## 🎨 Variables by Category

### 1️⃣ Core Configuration

| Variable | Required | Example Value | Security Level |
|----------|----------|---------------|----------------|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host.neon.tech/db?sslmode=require` | 🔴 **Critical** - Contains password |
| `SESSION_SECRET` | ✅ Yes | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` | 🔴 **Critical** - Encryption key |
| `ADMIN_SECRET` | ✅ Yes | `super-secure-admin-password-2026` | 🔴 **Critical** - Admin access |
| `NODE_ENV` | ✅ Yes | `production` | 🟢 **Public** - Safe to share |
| `PORT` | ✅ Yes | `5000` | 🟢 **Public** - Safe to share |

**Notes:**
- 🔴 **Critical** = NEVER commit to Git, NEVER share publicly
- 🟢 **Public** = Safe to include in documentation

---

### 2️⃣ Push Notifications (Alarms)

| Variable | Required | Example Value | Purpose |
|----------|----------|---------------|---------|
| `VAPID_PUBLIC_KEY` | ✅ Yes | `BHxT7ZD9...` (87 chars) | Identifies your app to browsers |
| `VAPID_PRIVATE_KEY` | ✅ Yes | `qR8vK2mN...` (43 chars) | Signs push notifications |
| `VAPID_SUBJECT` | ✅ Yes | `mailto:admin@yourapp.com` | Contact email for push service |

**How to Generate:**
```bash
npx web-push generate-vapid-keys
```

**Output:**
```
Public Key: BHxT7ZD9Ke...
Private Key: qR8vK2mN4P...
```

**Security:**
- Public key: Can be shared (sent to browsers)
- Private key: 🔴 **Must keep secret**

---

### 3️⃣ AI Features (Optional)

| Variable | Required | Example Value | Used For |
|----------|----------|---------------|----------|
| `GROQ_API_KEY` | ❌ No | `gsk_1a2b3c...` | AI-powered note summaries using Groq's LLaMA models |

**How to Get:**
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create API key
4. Free tier: 14,400 requests/day

**If Not Set:**
- App works normally
- AI summary feature disabled
- No errors or crashes

---

## 🚀 Setup Guide

### Step 1: Copy Template

```bash
# Copy example to create your .env file
cp .env.example .env
```

### Step 2: Fill Required Variables

```bash
# Edit .env file
nano .env
# or
code .env
```

### Step 3: Generate Secrets

```bash
# Generate session secret
openssl rand -base64 32

# Generate VAPID keys
npx web-push generate-vapid-keys
```

### Step 4: Get Database URL

1. Go to [Neon.tech](https://neon.tech)
2. Sign up (free tier available)
3. Create project
4. Copy connection string
5. Paste into `DATABASE_URL`

---

## 📋 Complete Example

### `.env` File (Development)

```bash
# ============================================
# REQUIRED - Core Configuration
# ============================================
DATABASE_URL=postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/levelup?sslmode=require
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4
ADMIN_SECRET=my-super-secure-admin-password-2026
NODE_ENV=development
PORT=5000

# ============================================
# REQUIRED - Push Notifications (for alarms)
# ============================================
VAPID_PUBLIC_KEY=BHxT7ZD9KeVhVZxFdGhJkLmNpQrStUvWxYz1234567890AbCdEfGhIjKlMnOpQrStUvWxYz
VAPID_PRIVATE_KEY=qR8vK2mN4PxYz1234567890AbCdEfGhIjKlMn
VAPID_SUBJECT=mailto:admin@levelup-app.com

# ============================================
# OPTIONAL - AI Features (Note Summaries)
# ============================================
GROQ_API_KEY=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
```

---

## 🔒 Security Best Practices

### ✅ DO

| Action | Why |
|--------|-----|
| ✅ Use `.env` files | Keeps secrets out of code |
| ✅ Add `.env` to `.gitignore` | Prevents committing secrets |
| ✅ Use strong passwords (32+ chars) | Harder to crack |
| ✅ Generate random secrets | Unpredictable |
| ✅ Use different secrets for dev/prod | Limits damage if leaked |
| ✅ Rotate secrets regularly | Limits exposure window |
| ✅ Use environment variables in hosting | Secure deployment |

### ❌ DON'T

| Action | Why |
|--------|-----|
| ❌ Commit `.env` to Git | Exposes secrets publicly |
| ❌ Share secrets in chat/email | Easy to intercept |
| ❌ Use simple passwords | Easy to guess |
| ❌ Hardcode secrets in code | Visible in Git history |
| ❌ Reuse secrets across projects | One breach = all breached |
| ❌ Post secrets in screenshots | Hard to revoke |

---

## 🌐 Deployment Platforms

### Render.com (Recommended)

**How to add:**
1. Go to Dashboard → Your Service
2. Click "Environment" tab
3. Add each variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://...`
4. Click "Save Changes"
5. Service auto-restarts

**Pro tips:**
- Use "Generate Value" button for `SESSION_SECRET`
- Render provides free PostgreSQL addon
- Environment changes trigger automatic redeploy

**Free Tier Includes:**
- ✅ 750 hours/month
- ✅ Auto-deploy from Git
- ✅ Free SSL certificates
- ✅ Custom domains

---

### Railway

**How to add:**
1. Select your project
2. Click "Variables" tab
3. Click "New Variable"
4. Add key and value
5. Deploy

**Pro tip:** Railway can auto-provision PostgreSQL

---

### Heroku

**How to add:**
```bash
# Via CLI
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set SESSION_SECRET="..."

# Via Dashboard
Settings → Config Vars → Reveal Config Vars
```

---

## 🛠️ Troubleshooting

### Problem: "DATABASE_URL is not defined"

**Cause:** Missing `.env` file or variable

**Fix:**
```bash
# 1. Check if .env exists
ls -la .env

# 2. If not, create it
cp .env.example .env

# 3. Add DATABASE_URL
echo 'DATABASE_URL=postgresql://...' >> .env
```

---

### Problem: "Push notifications not working"

**Cause:** Missing VAPID keys

**Fix:**
```bash
# 1. Generate keys
npx web-push generate-vapid-keys

# 2. Copy output to .env
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:your-email@example.com

# 3. Restart server
npm run dev
```

---

### Problem: "Session keeps logging out"

**Cause:** `SESSION_SECRET` changing or not set

**Fix:**
```bash
# 1. Generate stable secret
openssl rand -base64 32

# 2. Add to .env (don't change it again)
SESSION_SECRET=<generated secret>

# 3. In production, set same secret in hosting platform
```

---

### Problem: "AI summaries not working"

**Cause:** `GROQ_API_KEY` not set or invalid

**Fix:**
```bash
# 1. Get API key from https://console.groq.com
# 2. Add to .env
GROQ_API_KEY=gsk_...

# 3. Verify it's working
# Try generating a note summary in the app
```

---

## 📊 Platform-Specific Requirements

### Render (Your Platform)

| Variable | Required | Notes |
|----------|----------|-------|
| `PORT` | ✅ Yes | Must be `10000` (Render requirement) |
| `DATABASE_URL` | ✅ Yes | Use Neon (free) or Render PostgreSQL |
| `NODE_ENV` | ✅ Yes | Set to `production` |
| All Others | ✅ Yes | Add all required variables in Environment tab |

**Render-Specific Notes:**
- Free tier: 750 hours/month (enough for 1 service running 24/7)
- Service sleeps after 15 minutes of inactivity (free tier)
- First request after sleep takes ~30 seconds to wake up
- Paid tier ($7/month): No sleep, faster, more resources

### Railway (Alternative)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ Yes | Can auto-provision PostgreSQL |
| `PORT` | ❌ Auto | Railway provides `PORT` automatically |
| Credit-based | ⚠️ Note | $5 free credit/month, pay-as-you-go after |

### Heroku (Alternative)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ Yes | Can provision Heroku Postgres |
| `PORT` | ❌ Auto | Heroku provides `PORT` automatically |
| Eco Plan | 💰 Paid | $5/month minimum (no free tier anymore) |

---

## ✅ Checklist

### Development Setup
- [ ] Create `.env` file
- [ ] Add `DATABASE_URL`
- [ ] Generate `SESSION_SECRET`
- [ ] Generate `ADMIN_SECRET`
- [ ] Generate VAPID keys
- [ ] (Optional) Add `GROQ_API_KEY`
- [ ] Run `npm run dev`
- [ ] Test alarms work
- [ ] Test admin login works

### Production Setup
- [ ] Set all required variables in hosting platform
- [ ] Use production database URL
- [ ] Use strong, unique `SESSION_SECRET`
- [ ] Use strong, unique `ADMIN_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Set correct `PORT` for platform
- [ ] Test deployment
- [ ] Verify push notifications work
- [ ] Test admin dashboard access

---

## 🔗 Quick Links

| Resource | URL | Purpose |
|----------|-----|---------|
| **Neon DB** | https://neon.tech | Free PostgreSQL database |
| **Groq Console** | https://console.groq.com | Free AI API keys |
| **VAPID Generator** | Run `npx web-push generate-vapid-keys` | Generate push notification keys |
| **Random Secret** | Run `openssl rand -base64 32` | Generate secure secrets |

---

## 📞 Need Help?

**Common Questions:**

**Q: Can I use a different database?**  
A: Yes! Any PostgreSQL database works. Update `DATABASE_URL` format accordingly.

**Q: Do I need GROQ_API_KEY?**  
A: No, it's optional. Only needed for AI note summaries feature.

**Q: How long should SESSION_SECRET be?**  
A: Minimum 32 characters. Use `openssl rand -base64 32` to generate.

**Q: Can I change VAPID keys after deployment?**  
A: Yes, but existing push subscriptions will stop working. Users need to re-subscribe.

**Q: What if I accidentally committed .env?**  
A: 🚨 **Urgent:** Rotate ALL secrets immediately, remove from Git history, update production.

---

*Last Updated: February 25, 2026*
