import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyB1n3D7OduhzA-EAHg9xrICay1k7DTCVwc',
  authDomain: 'academic-aide.firebaseapp.com',
  projectId: 'academic-aide',
  storageBucket: 'academic-aide.firebasestorage.app',
  messagingSenderId: '861423624712',
  appId: '1:861423624712:android:3b9c133e29ee95dee3e7bd',
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// For local development/emulator testing (optional)
// connectFunctionsEmulator(functions, 'localhost', 5001);

export default app;
