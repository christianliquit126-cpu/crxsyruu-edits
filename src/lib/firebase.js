import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let database = null
let auth = null

const isConfigured = Object.values(firebaseConfig).every(v => v && v !== 'undefined')

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    database = getDatabase(app)
    auth = getAuth(app)
  } catch (err) {
    console.warn('[Tempest] Firebase init failed:', err.message)
  }
} else {
  console.info('[Tempest] Firebase credentials not set — running in demo mode.')
}

export { database, auth, isConfigured }
export default app
