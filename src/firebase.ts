import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

console.log('Firebase Config Loaded:', {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain
});

// Ensure we have a valid config
if (!firebaseConfig.apiKey) {
  console.error('Firebase API Key is missing. Please check your firebase-applet-config.json');
}

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);
