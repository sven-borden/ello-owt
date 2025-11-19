# Security Analysis - OWT Chess Elo Tracker

**Date:** 2025-01-19
**Status:** Multiple critical vulnerabilities identified

## Executive Summary

This security analysis identifies 10 security threats in the OWT Chess Elo Tracker application, ranging from critical to low severity. The most critical issue is the wide-open Firestore security rules that allow anyone with access to the Firebase configuration to read, write, and delete all data without authentication.

**Risk Level:** 🔴 **CRITICAL**

---

## Critical Security Threats

### 1. 🔴 CRITICAL: Wide Open Firestore Security Rules
**Location:** `firestore.rules:10,14,18`

**Threat:**
Your Firestore rules allow ANYONE with access to your Firebase config to read, write, and delete ALL data:
```javascript
allow read, write: if true;
```

**Impact:**
- Any malicious actor can delete all players, matches, and Elo history
- Data can be modified arbitrarily (cheating Elo scores)
- Privacy violation - anyone can read all data
- No audit trail of who made changes

**Mitigation:**
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Option 1: Require authentication
    match /players/{playerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true; // Admin-only writes
    }

    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true;
    }

    match /eloHistory/{historyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true;
    }
  }
}
```

---

### 2. 🔴 HIGH: No API Authentication
**Location:** `app/api/add-player/route.ts:6`

**Threat:**
The `/api/add-player` endpoint has zero authentication checks. Anyone can POST to it.

**Impact:**
- Attackers can flood your database with fake players
- No way to trace who added players
- Potential DoS via database quota exhaustion

**Mitigation:**
```typescript
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  // Option 1: Check for API key
  const headersList = headers()
  const apiKey = headersList.get('x-api-key')

  if (apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Option 2: Use Firebase Auth
  // Verify Firebase ID token from request

  // ... rest of code
}
```

---

### 3. 🟡 HIGH: Client-Side Business Logic
**Location:** `app/page.tsx:53-156`

**Threat:**
All match recording and Elo calculations happen client-side. A malicious user can:
- Modify the JavaScript to give themselves favorable Elo changes
- Submit fake match results
- Manipulate the calculation logic

**Impact:**
- Data integrity compromised
- Cheating via browser DevTools
- No server-side validation

**Mitigation:**
Move match recording to a server action or API route:
```typescript
// app/api/record-match/route.ts
export async function POST(request: NextRequest) {
  // Authenticate request
  // Validate inputs server-side
  // Calculate Elo server-side (don't trust client)
  // Use Firebase Admin SDK for atomic transactions
  // Return results
}
```

---

## Medium Severity Threats

### 4. 🟡 MEDIUM: XSS Vulnerability in Player Names
**Location:** `app/api/add-player/route.ts:10-15`, `components/AddPlayerForm.tsx:19-22`

**Threat:**
Player names are not sanitized for HTML/JavaScript. While React escapes by default, stored XSS could occur if:
- Data is displayed in unsafe contexts
- Future code changes introduce `dangerouslySetInnerHTML`
- Names exported to CSV/PDF without sanitization

**Impact:**
- Potential XSS if displayed unsafely
- Data integrity issues (control characters, extremely long names)

**Mitigation:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

// Server-side validation
if (!name || typeof name !== 'string' || name.trim() === '') {
  return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
}

// Sanitize and validate
const sanitizedName = DOMPurify.sanitize(name.trim())

// Length limits
if (sanitizedName.length > 50) {
  return NextResponse.json({ error: 'Name too long' }, { status: 400 })
}

// Character whitelist
if (!/^[a-zA-Z0-9\s\-\_]+$/.test(sanitizedName)) {
  return NextResponse.json({ error: 'Invalid characters in name' }, { status: 400 })
}
```

---

### 5. 🟡 MEDIUM: No Rate Limiting
**Location:** All API routes and client operations

**Threat:**
No protection against:
- Brute force attacks
- Database quota exhaustion
- DoS attacks via excessive writes

**Impact:**
- Service unavailability
- Unexpected Firebase billing
- Database performance degradation

**Mitigation:**
```typescript
// Use Vercel's rate limiting or upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  // ... rest of code
}
```

---

### 6. 🟡 MEDIUM: Firebase Config Exposure
**Location:** `lib/firebase.ts:5-12`, `.env.example:3-8`

**Threat:**
Firebase API keys are exposed in client bundle (NEXT_PUBLIC_ prefix). While Firebase API keys are meant to be public, they can be abused if:
- Security rules are weak (like yours currently are)
- No App Check enforcement
- No domain restrictions

**Impact:**
- Anyone can use your Firebase project from their own website
- Increased quota usage
- Potential abuse

**Mitigation:**
1. Fix Firestore security rules (see #1)
2. Enable and enforce App Check in Firestore rules:
```javascript
match /players/{playerId} {
  allow read, write: if request.auth != null &&
                        request.app.token.firebase.app_id == 'your-app-id';
}
```
3. Configure Firebase App Check debug tokens for development
4. Set up allowed domains in Firebase Console

---

## Low Severity Threats

### 7. 🔵 LOW: No Content Security Policy
**Location:** `next.config.ts:3-5`

**Threat:**
Missing CSP headers allow:
- XSS attacks to be more effective
- Data exfiltration via malicious scripts
- Clickjacking attacks

**Mitigation:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

---

### 8. 🔵 LOW: Missing CSRF Protection
**Location:** All forms

**Threat:**
State-changing operations lack CSRF tokens. While Next.js SameSite cookies provide some protection, explicit CSRF tokens are better.

**Impact:**
- Attackers could trick users into submitting matches
- Cross-site request forgery

**Mitigation:**
Use Next.js server actions with built-in CSRF protection or implement CSRF tokens manually.

---

### 9. 🔵 LOW: Information Disclosure in Errors
**Location:** `app/page.tsx:41,152`, `app/api/add-player/route.ts:38`

**Threat:**
Console.error() statements log detailed error information that could help attackers understand your system.

**Mitigation:**
```typescript
// Use proper logging service
import * as Sentry from '@sentry/nextjs'

catch (error) {
  // Log to monitoring service
  Sentry.captureException(error)

  // Return generic error to user
  return NextResponse.json(
    { error: 'An error occurred' },
    { status: 500 }
  )
}
```

---

### 10. 🔵 LOW: No Audit Logging
**Location:** All write operations

**Threat:**
No way to track:
- Who added/modified players
- When matches were recorded
- Suspicious activity patterns

**Mitigation:**
Add audit logging to all write operations:
```typescript
await addDoc(collection(db, 'auditLog'), {
  action: 'PLAYER_ADDED',
  userId: request.headers.get('x-user-id'),
  ip: request.ip,
  timestamp: Timestamp.now(),
  details: { playerId: docRef.id, playerName: sanitizedName }
})
```

---

## Priority Recommendations

### 🔴 Immediate (Do Today):
1. **Fix Firestore security rules** - this is the most critical vulnerability
2. **Add authentication to API routes**
3. **Implement rate limiting**

### 🟡 Short Term (This Week):
4. Move match recording to server-side
5. Add input sanitization
6. Enforce App Check in Firestore rules
7. Add CSP headers

### 🔵 Medium Term (This Month):
8. Implement audit logging
9. Set up error monitoring (Sentry)
10. Add CSRF protection

---

## Additional Security Best Practices

### Environment Variables
- Never commit `.env.local` to version control
- Rotate Firebase API keys if they've been exposed
- Use different Firebase projects for dev/staging/production

### Dependency Management
- Regularly run `npm audit` to check for vulnerable dependencies
- Keep all packages up to date
- Consider using Dependabot for automated security updates

### Monitoring
- Set up Firebase Security Rules monitoring
- Enable Firebase App Check analytics
- Monitor Firestore quota usage for unusual spikes
- Set up alerts for authentication failures

### Code Reviews
- Review all security-related changes
- Never skip security rules validation
- Test authentication flows thoroughly

---

## Conclusion

The application currently has critical security vulnerabilities that must be addressed immediately. The open Firestore security rules represent the highest risk and should be fixed before deploying to production or sharing the application URL with anyone outside your trusted team.

After implementing the immediate fixes, the application will be significantly more secure, though additional hardening measures should still be applied over time.

**Next Steps:**
1. Review this document with your team
2. Prioritize fixes based on the recommendation timeline
3. Test all security changes in a development environment
4. Deploy fixes to production
5. Monitor for any security incidents
