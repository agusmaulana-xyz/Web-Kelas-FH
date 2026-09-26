import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-justitia',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: await readFile('storage.rules', 'utf8') }
  });
});
after(async () => env?.cleanup());
const journal = ownerId => ({ title: 'Jurnal pengujian aturan', author: 'Penulis Penguji', abstract: 'Ringkasan jurnal untuk pengujian aturan akses.', category: 'Hukum Perdata', kind: 'text', content: 'Isi jurnal untuk menguji penyimpanan data tamu.', ownerId, createdAt: serverTimestamp(), filePath: '', fileName: '', fileSize: 0 });

test('anonymous guest can publish/read; unauthenticated requests cannot', async () => {
  const guest = env.authenticatedContext('guest-one', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
  const visitor = env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(guest, 'journals/guest-text'), journal('guest-one')));
  await assertSucceeds(getDoc(doc(guest, 'journals/guest-text')));
  await assertFails(getDoc(doc(visitor, 'journals/guest-text')));
  await assertFails(setDoc(doc(visitor, 'journals/no-auth'), journal('guest-one')));
});
test('journal rules reject forged ownership, invalid data and overwrites', async () => {
  const db = env.authenticatedContext('member-one').firestore();
  await assertFails(setDoc(doc(db, 'journals/forged'), journal('another-user')));
  await assertFails(setDoc(doc(db, 'journals/invalid'), { ...journal('member-one'), category: 'Unknown' }));
  await assertFails(setDoc(doc(db, 'journals/oversized'), { ...journal('member-one'), content: 'x'.repeat(100001) }));
  await assertFails(setDoc(doc(db, 'journals/extra'), { ...journal('member-one'), isAdmin: true }));
  await assertSucceeds(setDoc(doc(db, 'journals/member-text'), journal('member-one')));
  await assertFails(updateDoc(doc(db, 'journals/member-text'), { title: 'Changed by client' }));
  await assertFails(setDoc(doc(db, 'journals/wrong-file-path'), { ...journal('member-one'), kind: 'pdf', content: '', fileName: 'source.pdf', fileSize: 100, filePath: 'journals/another-user/test/source.pdf' }));
});
test('storage permits guests but rejects foreign writes and unsupported files', async () => {
  const owner = env.authenticatedContext('file-owner', { firebase: { sign_in_provider: 'anonymous' } }).storage();
  const other = env.authenticatedContext('other-user').storage();
  const visitor = env.unauthenticatedContext().storage();
  const filePath = 'journals/file-owner/rules-pdf/source.pdf';
  const pdf = new TextEncoder().encode('%PDF-1.4\nTest content');
  await assertSucceeds(uploadBytes(ref(owner, filePath), pdf, { contentType: 'application/pdf' }));
  await assertSucceeds(getBytes(ref(other, filePath)));
  await assertFails(getBytes(ref(visitor, filePath)));
  await assertFails(uploadBytes(ref(other, 'journals/file-owner/forged/source.pdf'), pdf, { contentType: 'application/pdf' }));
  await assertFails(uploadBytes(ref(owner, 'journals/file-owner/wrong-type/source.pdf'), pdf, { contentType: 'text/html' }));
  await assertFails(uploadBytes(ref(owner, 'journals/file-owner/executable/source.exe'), pdf, { contentType: 'application/octet-stream' }));
  await assertFails(uploadBytes(ref(owner, 'journals/file-owner/too-big/source.pdf'), new Uint8Array(10485761), { contentType: 'application/pdf' }));
  await assertFails(deleteObject(ref(other, filePath)));
  await assertSucceeds(deleteObject(ref(owner, filePath)));
});
