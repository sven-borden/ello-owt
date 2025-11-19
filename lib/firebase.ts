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

// Initialize Firebase immediately in browser, but not during build
function initializeFirebaseApp() {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return { app: null, db: null }
  }

  try {
    const firebaseConfig = getFirebaseConfig()

    // Initialize Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getFirebaseApp()
    const db = getFirestore(app)

    // Initialize App Check
    if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_KEY),
        isTokenAutoRefreshEnabled: true,
      })
    }

    return { app, db }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    throw error
  }
}

// Initialize immediately when module loads in browser
const { app: firebaseApp, db: firebaseDB } = initializeFirebaseApp()

// Export the initialized instances
export const app = firebaseApp as FirebaseApp
export const db = firebaseDB as Firestore

// Export getter functions for explicit initialization
export function getApp(): FirebaseApp {
  if (!firebaseApp) {
    throw new Error('Firebase app is not initialized. This may occur during server-side rendering.')
  }
  return firebaseApp
}

export function getDB(): Firestore {
  if (!firebaseDB) {
    throw new Error('Firebase Firestore is not initialized. This may occur during server-side rendering.')
  }
  return firebaseDB
}
