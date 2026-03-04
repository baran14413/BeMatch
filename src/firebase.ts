import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
    apiKey: "AIzaSyCtj9XvTW2aiumZhrR3OXQk3U3sh01ffRQ",
    authDomain: "bematch-f168d.firebaseapp.com",
    databaseURL: "https://bematch-f168d-default-rtdb.firebaseio.com",
    projectId: "bematch-f168d",
    storageBucket: "bematch-f168d.firebasestorage.app",
    messagingSenderId: "137528078260",
    appId: "1:137528078260:web:9bbd45115bd2aaf8200ce1",
    measurementId: "G-B9HD1ESD1H"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Set persistence to Local
setPersistence(auth, browserLocalPersistence).catch(console.error)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const rtdb = getDatabase(app)
export default app
