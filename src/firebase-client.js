import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, sendPasswordResetEmail, linkWithPopup, linkWithCredential, EmailAuthProvider, signInWithCredential, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, orderBy, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getBlob, deleteObject, connectStorageEmulator } from 'firebase/storage';
import { validateJournal, validateFile, MIME_TYPES, MAX_FILE_SIZE } from './journal-model.js';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
export const firebaseConfigured = Object.values(config).every(value => Boolean(value?.trim()));
let auth, db, storage;
let initializationError;
if (firebaseConfigured) {
  try {
    const app = initializeApp(config);
    auth = getAuth(app); db = getFirestore(app); storage = getStorage(app);
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && ['localhost', '127.0.0.1'].includes(location.hostname)) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    }
  } catch (error) { initializationError = error; }
}
function requireFirebase() {
  if (!firebaseConfigured || initializationError) throw new Error('Layanan portal belum tersedia. Silakan coba kembali nanti.');
}
export function watchAuth(callback, onError) {
  if (!firebaseConfigured || initializationError) { queueMicrotask(() => callback(null)); return () => {}; }
  return onAuthStateChanged(auth, callback, onError);
}
export function currentUser() { return auth?.currentUser || null; }
export async function loginGuest() { requireFirebase(); return signInAnonymously(auth); }
export async function loginEmail(email, password) { requireFirebase(); return signInWithEmailAndPassword(auth, email, password); }
export async function registerEmail(email, password) {
  requireFirebase();
  return auth.currentUser?.isAnonymous
    ? linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))
    : createUserWithEmailAndPassword(auth, email, password);
}
export async function loginGoogle() {
  requireFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (!auth.currentUser?.isAnonymous) return signInWithPopup(auth, provider);
  try { return await linkWithPopup(auth.currentUser, provider); }
  catch (error) {
    const credential = GoogleAuthProvider.credentialFromError(error);
    if (error.code === 'auth/credential-already-in-use' && credential) return signInWithCredential(auth, credential);
    throw error;
  }
}
export async function logout() { requireFirebase(); return signOut(auth); }
export async function resetPassword(email) { requireFirebase(); return sendPasswordResetEmail(auth, email); }
export function watchJournals(onData, onError) {
  requireFirebase();
  return onSnapshot(query(collection(db, 'journals'), orderBy('createdAt', 'desc')), snapshot => {
    onData(snapshot.docs.map(item => ({ ...item.data(), id: item.id })));
  }, onError);
}
export async function publishJournal(input, file, onProgress = () => {}) {
  requireFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Masuk terlebih dahulu untuk mengunggah jurnal.');
  validateJournal(input);
  if (input.kind !== 'text') await validateFile(file, input.kind);
  const document = doc(collection(db, 'journals'));
  const filePath = input.kind === 'text' ? '' : `journals/${user.uid}/${document.id}/source.${input.kind}`;
  let uploaded = false;
  try {
    if (filePath) {
      const upload = uploadBytesResumable(ref(storage, filePath), file, { contentType: MIME_TYPES[input.kind] });
      await new Promise((resolve, reject) => upload.on('state_changed', snapshot => onProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 90)), reject, resolve));
      uploaded = true;
    }
    onProgress(95);
    await setDoc(document, {
      title: input.title.trim(), author: input.author.trim(), abstract: input.abstract.trim(), category: input.category,
      kind: input.kind, content: input.kind === 'text' ? input.content.trim() : '', ownerId: user.uid,
      createdAt: serverTimestamp(), filePath, fileName: filePath ? file.name : '', fileSize: filePath ? file.size : 0
    });
    onProgress(100);
    return document.id;
  } catch (error) {
    if (uploaded) { try { await deleteObject(ref(storage, filePath)); } catch { /* Preserve the original failure for the user. */ } }
    throw error;
  }
}
export async function journalBlob(journal) {
  requireFirebase();
  if (!auth.currentUser) throw new Error('Masuk terlebih dahulu untuk membaca jurnal.');
  if (journal.kind === 'text') return new Blob([journal.content], { type: 'text/plain;charset=utf-8' });
  return getBlob(ref(storage, journal.filePath), MAX_FILE_SIZE);
}
