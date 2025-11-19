import { initializeApp, getApps, getApp as getFirebaseApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// Validate and get Firebase configuration
function getFirebaseConfig() {
  const requiredEnvVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Check for missing environment variables
  const envVarNames: Record<string, string> = {
    apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => envVarNames[key])

  if (missingVars.length > 0) {
    const errorMsg = `Missing required Firebase environment variables: ${missingVars.join(', ')}. Please check your environment configuration.`
    console.error(errorMsg)
    if (typeof window !== 'undefined') {
      // Show error in browser console for easier debugging
      console.error('Firebase Configuration Error:', {
        missing: missingVars,
        help: 'Add these environment variables to your .env.local file (development) or Vercel dashboard (production)'
      })
    }
    throw new Error(errorMsg)
  }

  return {
    apiKey: requiredEnvVars.apiKey!,
    authDomain: requiredEnvVars.authDomain!,
    projectId: requiredEnvVars.projectId!,
    storageBucket: requiredEnvVars.storageBucket!,
    messagingSenderId: requiredEnvVars.messagingSenderId!,
    appId: requiredEnvVars.appId!,
  }
}

// Lazy initialization to avoid errors during build time
let _app: FirebaseApp | null = null
let _db: Firestore | null = null
let _initialized = false

function initializeFirebase() {
  if (_initialized) return

  const firebaseConfig = getFirebaseConfig()

  // Initialize Firebase
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getFirebaseApp()
  _db = getFirestore(_app)

  // Initialize App Check
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY) {
    initializeAppCheck(_app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  }

  _initialized = true
}

// Export getters that ensure initialization before use
export const getApp = () => {
  if (!_app) initializeFirebase()
  return _app!
}

export const getDB = () => {
  if (!_db) initializeFirebase()
  return _db!
}

// For backward compatibility, export app and db as getters
export const app = new Proxy({} as FirebaseApp, {
  get(_, prop) {
    return (getApp() as any)[prop]
  }
})

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    return (getDB() as any)[prop]
  }
})
