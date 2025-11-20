# Firebase Admin SDK Setup

This guide explains how to set up the Firebase Admin SDK credentials for server-side match recording.

## Why Firebase Admin SDK?

The app now uses **server-side Elo calculations** via Next.js API Routes instead of client-side calculations. This prevents users from manipulating Elo scores through browser DevTools.

## Getting Service Account Credentials

### Step 1: Go to Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com)
2. Select your project (ello-owt)

### Step 2: Generate Service Account Key
1. Click the **⚙️ Settings** icon (top left) → **Project Settings**
2. Go to the **Service Accounts** tab
3. Click **Generate New Private Key**
4. Click **Generate Key** to download a JSON file

### Step 3: Extract Values from JSON
Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "ello-owt",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour long private key here\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@ello-owt.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### Step 4: Add to .env.local
Copy these three values to your `.env.local` file:

```bash
# Firebase Admin SDK (Server-side only)
FIREBASE_PROJECT_ID=ello-owt
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ello-owt.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT**:
- Keep the quotes around `FIREBASE_PRIVATE_KEY`
- Keep the `\n` characters - they represent line breaks
- The private key is one long line with `\n` characters

### Step 5: Add to Vercel (for deployment)
When deploying to Vercel, add these same three environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (paste the entire value including quotes)

## Security Notes

⚠️ **NEVER commit the service account JSON file or .env.local to git!**

- The `.gitignore` already excludes `.env.local`
- Service account credentials grant **full admin access** to your Firebase project
- If exposed, anyone can read/write/delete all your Firestore data
- If you accidentally expose them, immediately delete the service account and generate a new one

## How It Works

### Before (Client-side):
```
Browser → Calculate Elo → Write to Firestore ❌ (can be manipulated)
```

### After (Server-side):
```
Browser → API Route → Calculate Elo → Write to Firestore ✅ (secure)
```

The Elo calculation now happens in `/app/api/record-match/route.ts` using Firebase Admin SDK, which runs on Vercel's servers and cannot be manipulated by users.

## Testing

After setting up the credentials, test that it works:

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000
3. Record a match between two players
4. Check that Elo ratings update correctly

If you see an error like "Failed to record match", check:
- All three Admin SDK environment variables are set in `.env.local`
- The private key includes the `\n` characters
- You've restarted the dev server after adding the variables

## Troubleshooting

### Error: "Could not load the default credentials"
- You haven't set the Firebase Admin SDK environment variables
- Run `cp .env.example .env.local` and fill in the Admin SDK values

### Error: "Invalid private key"
- Make sure the private key has quotes around it
- Make sure the `\n` characters are preserved (don't replace with actual line breaks)
- Copy the entire value from the JSON file

### Error: "Permission denied"
- The service account doesn't have permission
- Regenerate the service account key from Firebase Console
