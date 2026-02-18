# 🔧 Manual Password Reset Guide

If email isn't working, you can manually reset passwords through the database or admin panel.

---

## Option 1: Database Password Reset (For You - Admin)

### **Step 1: Access Render PostgreSQL**

1. Go to Render Dashboard → Your Database
2. Click **"Connect"** → Copy the **"External Database URL"**
3. Use a PostgreSQL client:
   - **TablePlus** (recommended, free): https://tableplus.com
   - **DBeaver**: https://dbeaver.io
   - Or use Render's web shell

### **Step 2: Generate New Password Hash**

Run this in your local terminal or Node.js console:

```javascript
// Using bcrypt (what your app uses)
const bcrypt = require('bcrypt');
const newPassword = 'temporary123'; // The new password
bcrypt.hash(newPassword, 10).then(hash => {
  console.log('Hash:', hash);
});
```

**Or use an online bcrypt generator:**
- https://bcrypt-generator.com
- Enter the new password
- Copy the hash

### **Step 3: Update User Password in Database**

```sql
-- Find the user first
SELECT id, username, email FROM users WHERE email = 'user@example.com';

-- Update their password with the hash
UPDATE users 
SET password = '$2b$10$...(paste the hash here)...' 
WHERE email = 'user@example.com';
```

### **Step 4: Tell User**

Send them a message (Discord, WhatsApp, etc.):
- "I've reset your password to: `temporary123`"
- "Please log in and change it in your profile"

---

## Option 2: Create Admin Password Reset Endpoint

**Add a secret admin endpoint to your app:**

Add this to `server/routes.ts`:

```typescript
// Secret admin endpoint for manual password resets
app.post("/api/admin/reset-password", async (req, res) => {
  const { adminSecret, email, newPassword } = req.body;
  
  // Check admin secret (set in env: ADMIN_SECRET=your-secret-key)
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));
    
    res.json({ 
      success: true, 
      message: `Password reset for ${email}` 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});
```

**Add to Render environment:**
```
ADMIN_SECRET=your-super-secret-key-123
```

**Usage (with curl or Postman):**
```bash
curl -X POST https://your-app.onrender.com/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "adminSecret": "your-super-secret-key-123",
    "email": "user@example.com",
    "newPassword": "temporary123"
  }'
```

---

## Option 3: Temporary "Reset Portal" for Prototype

**Create a simple admin page in your app:**

Create `client/src/pages/AdminPasswordReset.tsx`:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function AdminPasswordReset() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, email, newPassword }),
    });
    
    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div className="container max-w-md mx-auto mt-20">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Password Reset</h1>
        <div className="space-y-4">
          <Input
            placeholder="Admin Secret"
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
          />
          <Input
            placeholder="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button onClick={handleReset} className="w-full">
            Reset Password
          </Button>
          {message && (
            <p className="text-sm text-center">{message}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
```

Access at: `https://your-app.onrender.com/admin/reset-password`

---

## Option 4: Use Render's PostgreSQL Shell

**Quick reset without code changes:**

1. Go to Render Dashboard → Your Database
2. Click **"Shell"** tab
3. Run these commands:

```sql
-- Check user exists
SELECT id, email, username FROM users WHERE email = 'user@example.com';

-- Generate hash at: https://bcrypt-generator.com
-- Then update:
UPDATE users 
SET password = '$2b$10$ABC123...(hash here)' 
WHERE email = 'user@example.com';
```

---

## 🎯 Best Option for Prototype:

**For now (quick fix):**
- Use **Option 1** (Database reset) - Takes 2 minutes
- Manually reset passwords when users forget them

**For better UX (10 mins):**
- Add **Option 2** (Admin endpoint) - Cleaner workflow
- You can reset from anywhere with curl/Postman

**Long-term:**
- Deploy to Railway OR buy a domain
- Get proper email working

---

## ⚠️ Security Note:

These are workarounds for prototypes/testing. For production:
- Use proper email-based password reset
- Don't leave admin endpoints exposed
- Always use strong admin secrets

---

**Choose what works for your prototype!** 🚀
