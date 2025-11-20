# Implement server-side Elo calculation with Next.js API routes

## Summary

This PR migrates Elo rating calculations from client-side to server-side using Next.js API Routes and Firebase Admin SDK. This addresses the **HIGH severity security vulnerability** where Elo calculations could be manipulated via browser DevTools.

## Problem

The original implementation performed all Elo calculations in the browser, making it vulnerable to:
- Client-side manipulation of Elo scores
- Data integrity issues
- No server-side validation
- Race conditions in concurrent updates

## Solution

### Server-Side Architecture
- ✅ **API Route**: `/api/record-match` handles all match recording and Elo calculations
- ✅ **Firebase Admin SDK**: Server-only access to Firestore with elevated privileges
- ✅ **Atomic Transactions**: Ensures all updates succeed or fail together
- ✅ **Server-Side Validation**: Cannot be bypassed by users

### Key Changes

**New Files:**
- `lib/firebase-admin.ts` - Firebase Admin SDK initialization
- `app/api/record-match/route.ts` - Server-side match recording endpoint
- `SETUP_ADMIN_SDK.md` - Guide for Firebase service account setup
- `SECURITY_ANALYSIS.md` - Comprehensive security audit
- `BRANDING.md` - OWT Swiss design system documentation

**Modified Files:**
- `app/page.tsx` - Now calls `/api/record-match` instead of direct Firestore writes
- `lib/elo.ts` - Simplified to only export constants (calculation logic moved to API)
- `CLAUDE.md` - Updated architecture documentation
- `README.md` - Updated project structure

**Removed:**
- `components/MatchForm.tsx` - Unused component (match form is inline)
- Elo calculation functions from `lib/elo.ts` (now in API route)

## Security Improvements

| Before | After |
|--------|-------|
| ❌ Client-side Elo calculation | ✅ Server-side calculation |
| ❌ No validation | ✅ Server-side validation |
| ❌ Race conditions possible | ✅ Atomic transactions |
| ❌ Manipulable via DevTools | ✅ Secure server execution |

## Testing

### Local Testing
1. Set up Firebase Admin credentials (see `SETUP_ADMIN_SDK.md`)
2. Add to `.env.local`:
   ```bash
   FIREBASE_PROJECT_ID=ello-owt
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ello-owt.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
3. Run `npm run dev`
4. Record a match and verify Elo ratings update correctly

### Production Build
```bash
npm run build  # ✅ Verified - builds successfully
```

## Deployment Requirements

### Vercel Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

See `SETUP_ADMIN_SDK.md` for detailed instructions on obtaining these values.

## Benefits

- 🔒 **Security**: Prevents Elo manipulation - calculations run server-side
- ⚡ **Performance**: Atomic transactions ensure data consistency
- 💰 **Cost**: Runs on Vercel for free (no Firebase Functions required)
- 📊 **Reliability**: Server-side validation catches errors before writes
- 🏗️ **Architecture**: Clean separation of concerns

## Documentation

- ✅ `CLAUDE.md` - Updated with new architecture
- ✅ `SETUP_ADMIN_SDK.md` - Firebase Admin setup guide
- ✅ `SECURITY_ANALYSIS.md` - Security audit with 10 identified threats
- ✅ `BRANDING.md` - Complete OWT Swiss color palette
- ✅ `.env.example` - Updated with Admin SDK variables

## Breaking Changes

None - backward compatible with existing Firestore schema

## Checklist

- [x] Server-side Elo calculation implemented
- [x] Firebase Admin SDK integrated
- [x] Client updated to use API route
- [x] Documentation updated
- [x] Security analysis documented
- [x] Build verified (`npm run build` passes)
- [x] Code cleaned up (unused files removed)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
