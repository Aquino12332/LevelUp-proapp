# Admin Dashboard Setup Guide

## 🎯 Overview

You now have a complete **Lightweight Admin Dashboard** for tracking student activity and managing accounts. This system allows you to:

✅ **Track Students**: See who's using the app and when they open/close it
✅ **View Activity**: Monitor login/logout times, online status, and device types
✅ **Reset Passwords**: Manually reset student passwords without email
✅ **View Statistics**: Real-time stats on total users, online users, and activity
✅ **Search Users**: Quickly find students by username or email

---

## 🚀 Quick Start

### 1. Set Up Admin Secret

Add this to your `.env` file (or Render environment variables):

```env
ADMIN_SECRET=your-secure-secret-here
```

**Important**: Choose a strong, random secret. This is your admin password!

Example strong secret: `admin_2024_secure_key_9x8z7y6w5v`

### 2. Run Database Migration

Since you're using PostgreSQL (Neon), you need to add the new tracking fields:

**Option A: Using Neon Dashboard**
1. Go to your Neon dashboard
2. Open the SQL Editor
3. Copy and paste the SQL from `server/migrations/add-admin-tracking.sql`
4. Execute the migration

**Option B: Using Drizzle (Automatic)**
```bash
npm run db:push
```

### 3. Access Admin Dashboard

Navigate to: `https://your-app-url.com/admin/login`

Or locally: `http://localhost:5000/admin/login`

Enter your `ADMIN_SECRET` to access the dashboard.

---

## 📊 Features

### Dashboard Overview
- **Total Users**: All registered students
- **Online Now**: Currently active students
- **Active Today**: Students who logged in within 24 hours
- **New This Week**: Recent registrations (last 7 days)
- **Device Breakdown**: Mobile, desktop, tablet usage

### User Management Table
Shows all students with:
- Username and email
- Online/Offline status (real-time)
- Device type (mobile/desktop/tablet)
- Last login time
- Total study time
- Current level
- Password reset button

### Manual Password Reset
1. Click "Reset Password" for any student
2. Enter new password (minimum 6 characters)
3. Password is changed immediately
4. Student can login with new password

---

## 🔒 Security

### Admin Authentication
- Protected by `ADMIN_SECRET` environment variable
- Secret is stored in sessionStorage (expires when browser closes)
- All admin API endpoints require the secret in headers
- Unauthorized attempts are logged

### What's Tracked
- **Login/Logout**: Timestamp of when students sign in/out
- **Online Status**: Real-time online/offline indicator
- **Device Type**: Mobile, desktop, or tablet
- **Session History**: App open/close times (in database)
- **IP Address**: Client IP for security audit (stored in sessions)

### Privacy Notes
- Passwords are **never** visible to admins
- Only hashed passwords are stored
- Student activity is for monitoring purposes only
- Complies with typical student app monitoring requirements

---

## 📱 Student Tracking Details

### How It Works

**1. When Student Logs In:**
```
✅ lastLoginAt updated
✅ isOnline set to true
✅ deviceType detected (mobile/desktop/tablet)
✅ New session created in userSessions table
```

**2. When Student Uses App:**
```
✅ Activity tracked on API requests
✅ lastActiveDate updated in userStats
```

**3. When Student Logs Out:**
```
✅ lastLogoutAt updated
✅ isOnline set to false
✅ Session end time recorded
```

### Session Tracking
The `userSessions` table stores:
- Session start time (app opened)
- Session end time (app closed/logged out)
- Device type
- User agent (browser/app info)
- IP address

You can query this table to see:
- How long students use the app
- Peak usage times
- Device preferences

---

## 🎓 For Your Validator

### What to Show

**"We track student activity through an admin dashboard":**
1. Show login screen at `/admin/login`
2. Enter admin secret to access
3. Show dashboard with:
   - Total registered students
   - Currently online students
   - Recent activity timeline
   - Device usage breakdown

**"We monitor when students open and close the app":**
1. Show user table with last login times
2. Point out online/offline status indicators
3. Show device type for each student
4. Explain session tracking in database

**"We can manually reset passwords":**
1. Click "Reset Password" on any student
2. Enter new password
3. Show success confirmation
4. Explain this helps reduce support burden

### Demo Talking Points
- ✅ **Real-time tracking**: Know exactly who's using the app right now
- ✅ **Activity monitoring**: See when students are most active
- ✅ **Device insights**: Understand if students prefer mobile or desktop
- ✅ **Admin convenience**: Reset passwords without email complications
- ✅ **Scalability**: Built to handle 200 users efficiently

---

## 🛠️ Technical Details

### API Endpoints

All endpoints require `x-admin-secret` header:

```typescript
// Authenticate admin
POST /api/admin/login
Headers: { "x-admin-secret": "your-secret" }

// Get all users with stats
GET /api/admin/users
Headers: { "x-admin-secret": "your-secret" }

// Get dashboard statistics
GET /api/admin/stats
Headers: { "x-admin-secret": "your-secret" }

// Get user session history
GET /api/admin/users/:userId/sessions
Headers: { "x-admin-secret": "your-secret" }

// Reset user password
POST /api/admin/users/:userId/reset-password
Headers: { "x-admin-secret": "your-secret" }
Body: { "newPassword": "newpass123" }
```

### Database Schema Changes

**Users Table (new fields):**
```sql
lastLoginAt: timestamp        -- When user last logged in
lastLogoutAt: timestamp       -- When user last logged out
isOnline: boolean             -- Current online status
deviceType: varchar           -- 'mobile', 'desktop', or 'tablet'
```

**New UserSessions Table:**
```sql
id: varchar (UUID)
userId: varchar               -- Reference to user
sessionStart: timestamp       -- App opened
sessionEnd: timestamp         -- App closed (null if still open)
deviceType: varchar           -- Device used
userAgent: text               -- Browser/app info
ipAddress: varchar            -- Client IP
```

### Middleware

**Activity Tracking:**
```typescript
// Automatically tracks user activity on all API requests
app.use("/api", trackUserActivity);

// Updates lastLoginAt, isOnline, deviceType
// Creates session on login
// Updates session end on logout
```

**Admin Protection:**
```typescript
// Validates admin secret on protected routes
app.get("/api/admin/*", requireAdmin, handler);

// Returns 403 if invalid secret
// Logs unauthorized attempts
```

---

## 🎨 Customization

### Change Admin Routes
Edit `client/src/App.tsx`:
```tsx
<Route path="/admin/login" component={AdminLogin} />
<Route path="/admin/dashboard" component={AdminDashboard} />
```

### Add More Admin Features
1. Create new endpoints in `server/routes.ts`
2. Add components to `AdminDashboard.tsx`
3. Use `requireAdmin` middleware for protection

### Styling
Admin dashboard uses:
- Tailwind CSS for styling
- shadcn/ui components
- Gradient backgrounds for professional look

---

## 📈 Performance

### Optimized for 200 Users
- Efficient database queries with indexes
- Connection pooling (max 20 concurrent)
- No heavy background processes
- Minimal overhead on student experience

### Database Indexes
```sql
CREATE INDEX userSessions_userId_idx ON userSessions(userId);
CREATE INDEX userSessions_sessionStart_idx ON userSessions(sessionStart);
```

---

## 🐛 Troubleshooting

### "Invalid admin credentials"
- Check `ADMIN_SECRET` in environment variables
- Ensure no extra spaces in the secret
- Try setting a new secret

### "Failed to fetch admin data"
- Verify database is running
- Check if migration was applied
- Look at server logs for errors

### Users not showing as online
- Ensure students are logging in (not just visiting)
- Check if middleware is active
- Verify database updates are working

### Can't reset password
- Ensure user exists in database
- Check password is at least 6 characters
- Verify admin secret is valid

---

## 🎯 Next Steps

### For Development:
1. ✅ Add `ADMIN_SECRET` to `.env`
2. ✅ Run database migration
3. ✅ Test admin login at `/admin/login`
4. ✅ Create test students and track activity

### For Production (Render):
1. ✅ Set `ADMIN_SECRET` in Render environment variables
2. ✅ Run migration in Neon dashboard
3. ✅ Access at `https://your-app.onrender.com/admin/login`
4. ✅ Share admin URL with your validator

### Optional Enhancements:
- 📊 Add charts for activity over time
- 📧 Email notifications for admin events
- 🔐 Multi-admin support with different roles
- 📱 Export user data to CSV
- 🕒 Session duration analytics

---

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Verify environment variables are set
3. Ensure database migration ran successfully
4. Test with a fresh browser session (clear cache)

---

**🎉 You're all set!** Your admin dashboard is ready to track students and manage accounts.

Access it at: `/admin/login` with your `ADMIN_SECRET`
