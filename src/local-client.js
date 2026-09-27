const json = async response => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Permintaan belum berhasil.');
  return body;
};
const request = (url, options) => fetch(url, { credentials: 'same-origin', ...options });
const authListeners = new Set();
let authRevision = 0;
function notifyAuth(user) { authRevision++; for (const listener of authListeners) listener(user); }
async function authRequest(url, options) {
  const result = await json(await request(url, options));
  notifyAuth(result.user || null);
  return result;
}

export function watchAuth(callback) {
  authListeners.add(callback);
  const revision = authRevision;
  jsonRequestMe().then(user => { if (revision === authRevision) callback(user); }, () => { if (revision === authRevision) callback(null); });
  return () => authListeners.delete(callback);
}
const jsonRequestMe = async () => (await json(await request('/api/me'))).user;
export async function loginEmail(email, password) {
  return authRequest('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
}
export async function registerEmail(email, password, registrationCode) {
  return authRequest('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, registrationCode }) });
}
export async function loginGuest() { return authRequest('/api/guest', { method: 'POST' }); }
export async function logout() { return authRequest('/api/logout', { method: 'POST' }); }
export function watchJournals(onData, onError) {
  let active = true;
  const load = async () => {
    try { const result = await json(await request('/api/journals')); if (active) onData(result.journals); }
    catch (error) { if (active) onError(error); }
  };
  load();
  const timer = setInterval(load, 5000);
  return () => { active = false; clearInterval(timer); };
}
export async function publishJournal(input, file, onProgress = () => {}) {
  let uploaded = null;
  if (file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    uploaded = { name: file.name, type: file.type, data: btoa(binary) };
  }
  onProgress(50);
  const result = await json(await request('/api/journals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, file: uploaded }) }));
  onProgress(100);
  return result.id;
}
export async function updateJournal(id, input, file, onProgress = () => {}) {
  let uploaded = null;
  if (file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    uploaded = { name: file.name, type: file.type, data: btoa(binary) };
  }
  onProgress(50);
  await json(await request(`/api/journals/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, file: uploaded }) }));
  onProgress(100);
}
export async function deleteJournal(id) {
  return json(await request(`/api/journals/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
export async function journalBlob(journal) {
  const response = await request(`/api/journals/${encodeURIComponent(journal.id)}/file`);
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Berkas jurnal tidak dapat dibaca.'); }
  return response.blob();
}
