# 1. AUTHENTICATION & USER MANAGEMENT

## Purpose: Secure user access and identity management

---

## Components:

- **`server/routes.ts`** - Passport.js setup with Google OAuth & local auth
- **`client/hooks/useAuth.ts`** - Frontend authentication hook
- **`client/pages/SignIn.tsx`** - Login/Register interface
- **`client/pages/ForgotPassword.tsx`** & **`ResetPassword.tsx`** - Password recovery

---

## Flow:

```
User → SignIn.tsx (login/register form)
  ↓
POST /api/auth/login or /api/auth/register
  ↓
server/routes.ts (handle auth, create session)
  ↓
Passport.js (create JWT, set session cookie)
  ↓
useAuth.ts (fetch /api/auth/me to verify user)
  ↓
Redirect to Dashboard (authenticated)
```

---

## Key Details:

- **Local Auth:** Username/password with bcrypt hashing
- **OAuth:** Google Sign-In integration
- **Session Management:** Express-session with 7-day expiration
- **Password Reset:** Email-based token verification
