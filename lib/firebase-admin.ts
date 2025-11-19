import * as admin from 'firebase-admin'

/**
 * Initialize Firebase Admin SDK lazily
 * This runs server-side only and has elevated privileges
 * Lazy initialization prevents build-time errors when env vars aren't available
 */
function initializeAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    // During build time, env vars might not be available - that's OK
    // Only throw error if we're actually trying to use the SDK at runtime
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase Admin SDK credentials missing. Please ensure FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment.'
      )
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    })
  }

  return admin
}

/**
 * Get the Firestore Admin instance
 * Initializes Firebase Admin on first access
 */
function getAdminDb() {
  initializeAdmin()
  return admin.firestore()
}

/**
 * Get the Firebase Admin instance
 * Initializes on first access
 */
function getAdmin() {
  return initializeAdmin()
}

export { getAdminDb, getAdmin }
