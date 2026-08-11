import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export type CloudErrorHandler = (errorMsg: string, details?: any) => void;
let cloudErrorHandler: CloudErrorHandler | null = null;

export function setCloudErrorHandler(handler: CloudErrorHandler | null) {
  cloudErrorHandler = handler;
}

function notifyCloudError(action: string, collectionName: string, err: any) {
  const reason = err?.message || err?.code || String(err) || 'Unknown Firestore error';
  const fullMsg = `Failed to ${action} ${collectionName} in Database: ${reason}`;
  console.warn(`[Firebase] ${fullMsg}`, err);
  if (cloudErrorHandler) {
    cloudErrorHandler(fullMsg, err);
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
    }
  }
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    // Use the custom databaseId if configured
    if (firebaseConfig.firestoreDatabaseId) {
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

// Strips unwanted fields and undefined values from documents before saving to Firestore to prevent setDoc errors
export function sanitizeDocForCloud<T extends Record<string, any>>(item: T): Record<string, any> {
  const cleanDoc: Record<string, any> = {};
  for (const key of Object.keys(item)) {
    if (
      key === 'department' ||
      key === 'email' ||
      key === 'hourlyRate' ||
      key === 'maxHoursPerWeek' ||
      key === 'role' ||
      key === 'active'
    ) {
      continue;
    }
    const val = item[key];
    // CRITICAL: Firestore setDoc/updateDoc fails if any field value is undefined
    if (val !== undefined) {
      cleanDoc[key] = val;
    }
  }
  return cleanDoc;
}

// Populates default local UI fallback values for components
export function populateLocalDefaults<T>(collectionName: string, item: any): T {
  const cleanItem = sanitizeDocForCloud(item);
  if (collectionName === 'employees') {
    return {
      avatarBg: 'bg-indigo-500',
      phone: '',
      ...cleanItem,
    } as T;
  }
  if (collectionName === 'shifts') {
    return {
      breakMinutes: 0,
      status: 'scheduled',
      ...cleanItem,
    } as T;
  }
  return cleanItem as T;
}

// Helpers for efficient Firestore sync (Minimal payload)
export async function syncCollectionToCloud<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  try {
    const database = getFirestoreDb();
    const colRef = collection(database, collectionName);
    for (const item of items) {
      const docRef = doc(colRef, item.id);
      const cleanItem = sanitizeDocForCloud(item);
      await setDoc(docRef, cleanItem); // Overwrite without merge to purge deleted fields
    }
  } catch (err) {
    notifyCloudError('sync', collectionName, err);
  }
}

export async function fetchCollectionFromCloud<T>(collectionName: string): Promise<T[] | null> {
  try {
    const database = getFirestoreDb();
    const colRef = collection(database, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;

    const result: T[] = [];
    for (const d of snapshot.docs) {
      const rawData = { id: d.id, ...d.data() };
      // Check if document contains any of the unwanted fields in DB and purge them
      if (
        'department' in rawData ||
        'email' in rawData ||
        'hourlyRate' in rawData ||
        'maxHoursPerWeek' in rawData ||
        'role' in rawData ||
        'active' in rawData
      ) {
        const cleanDoc = sanitizeDocForCloud(rawData);
        // Overwrite doc in DB without merge to delete these fields permanently from Firestore
        setDoc(d.ref, cleanDoc).catch((err) => notifyCloudError('clean doc in', collectionName, err));
      }
      result.push(populateLocalDefaults<T>(collectionName, rawData));
    }
    return result;
  } catch (err) {
    notifyCloudError('fetch', collectionName, err);
    return null;
  }
}

export async function saveDocToCloud<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  try {
    if (!item || !item.id) {
      console.warn(`[Firebase] Cannot save document to ${collectionName}: document or item.id is missing.`, item);
      return;
    }
    const database = getFirestoreDb();
    const docRef = doc(database, collectionName, item.id);
    const cleanItem = sanitizeDocForCloud(item);
    await setDoc(docRef, cleanItem); // Overwrite without merge to purge deleted fields from Firestore
  } catch (err) {
    notifyCloudError('save document to', collectionName, err);
  }
}

export async function deleteDocFromCloud(collectionName: string, id: string): Promise<void> {
  try {
    const database = getFirestoreDb();
    const docRef = doc(database, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    notifyCloudError('delete document from', collectionName, err);
  }
}

export async function saveUserCredentialsToCloud(username: string, passwordHash: string): Promise<void> {
  try {
    const database = getFirestoreDb();
    const docRef = doc(database, 'users', 'auth_credential');
    await setDoc(docRef, { username, passwordHash, updatedAt: new Date().toISOString() });
  } catch (err) {
    notifyCloudError('save user credentials to', 'users', err);
  }
}

export async function fetchUserCredentialsFromCloud(): Promise<{ username: string; passwordHash: string } | null> {
  try {
    const database = getFirestoreDb();
    const docRef = doc(database, 'users', 'auth_credential');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { username: string; passwordHash: string };
    }
  } catch (err) {
    notifyCloudError('fetch credentials from', 'users', err);
  }
  return null;
}
