import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { categories, MAX_FILE_SIZE, MAX_TEXT_BYTES, MIME_TYPES } from '../src/journal-model.js';

const scrypt = promisify(scryptCallback);
const root = path.resolve('data');
const usersFile = path.join(root, 'users.json');
const settingsFile = path.join(root, 'settings.json');
const journalsRoot = path.join(root, 'journals');
const sessions = new Map();
const MAX_REQUEST = Math.ceil(MAX_FILE_SIZE * 1.4) + 1024 * 1024;

async function readUsers() {
  await mkdir(root, { recursive: true });
  try { return JSON.parse(await readFile(usersFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await writeFile(usersFile, '[]\n', { flag: 'wx' }).catch(() => {}); return []; }
}
async function writeUsers(users) {
  const temp = `${usersFile}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(users, null, 2)}\n`, { flag: 'wx' });
  await rename(temp, usersFile);
}
async function readSettings() {
  await mkdir(root, { recursive: true });
  try { return JSON.parse(await readFile(settingsFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const settings = { registrationCode: randomBytes(8).toString('hex') };
    await writeFile(settingsFile, `${JSON.stringify(settings, null, 2)}\n`, { flag: 'wx' }).catch(() => {});
    return JSON.parse(await readFile(settingsFile, 'utf8'));
  }
}
const publicUser = user => ({ uid: user.uid, email: user.email, displayName: user.displayName, isAnonymous: Boolean(user.isAnonymous), role: user.role || (user.isAnonymous ? 'guest' : 'member') });
const canPublish = user => Boolean(user && !user.isAnonymous && (user.role || 'member') !== 'guest');
const canManageJournal = (user, journal) => canPublish(user) && (user.role === 'superadmin' || journal.ownerId === user.uid);
function isSameCode(provided, expected) {
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
function cookieHeader(req) { return (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('local_session='))?.slice('local_session='.length); }
async function sessionUser(req) {
  const key = cookieHeader(req), saved = key ? sessions.get(key) : null;
  if (!saved || saved.isAnonymous) return saved || null;
  const current = (await readUsers()).find(account => account.uid === saved.uid);
  if (!current) { sessions.delete(key); return null; }
  sessions.set(key, current);
  return current;
}
function setSession(res, user, secure) {
  const token = randomBytes(32).toString('hex'); sessions.set(token, user);
  res.setHeader('Set-Cookie', `local_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure ? '; Secure' : ''}`);
}
function clearSession(req, res) { const key = cookieHeader(req); if (key) sessions.delete(key); res.setHeader('Set-Cookie', 'local_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); }
async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > MAX_REQUEST) throw Object.assign(new Error('Ukuran permintaan terlalu besar.'), { status: 413 }); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Data permintaan tidak valid.'), { status: 400 }); }
}
const normalizedEmail = value => String(value || '').trim().toLowerCase();
function validateCredentials(email, password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw Object.assign(new Error('Masukkan alamat email yang valid.'), { status: 400 });
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw Object.assign(new Error('Password minimal 8 karakter.'), { status: 400 });
}
async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: Buffer.from(hash).toString('hex') };
}
async function passwordMatches(password, user) {
  const candidate = Buffer.from((await passwordHash(password, user.salt)).hash, 'hex');
  const saved = Buffer.from(user.passwordHash, 'hex');
  return candidate.length === saved.length && timingSafeEqual(candidate, saved);
}
function slug(value) {
  const result = String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
  return result || 'jurnal';
}
async function listJournals() {
  await mkdir(journalsRoot, { recursive: true });
  const dirs = await readdir(journalsRoot, { withFileTypes: true });
  const items = await Promise.all(dirs.filter(d => d.isDirectory()).map(async dir => {
    try { return JSON.parse(await readFile(path.join(journalsRoot, dir.name, 'journal.json'), 'utf8')); }
    catch { return null; }
  }));
  return items.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
}
async function findJournal(id) {
  await mkdir(journalsRoot, { recursive: true });
  const dirs = await readdir(journalsRoot, { withFileTypes: true });
  for (const dir of dirs.filter(entry => entry.isDirectory())) {
    try {
      const recordPath = path.join(journalsRoot, dir.name, 'journal.json');
      const journal = JSON.parse(await readFile(recordPath, 'utf8'));
      if (journal.id === id) return { journal, folder: path.join(journalsRoot, dir.name), recordPath };
    } catch {}
  }
  return null;
}
function validateJournal(input) {
  input = input && typeof input === 'object' ? input : {};
  const text = value => typeof value === 'string' ? value.trim() : '';
  const title = text(input.title), author = text(input.author), abstract = text(input.abstract), content = text(input.content);
  if (title.length < 5 || title.length > 180) throw Object.assign(new Error('Judul harus terdiri dari 5-180 karakter.'), { status: 400 });
  if (author.length < 2 || author.length > 100) throw Object.assign(new Error('Nama penulis harus terdiri dari 2-100 karakter.'), { status: 400 });
  if (!categories.includes(input.category)) throw Object.assign(new Error('Pilih kategori jurnal.'), { status: 400 });
  if (abstract.length < 20 || abstract.length > 2000) throw Object.assign(new Error('Ringkasan harus terdiri dari 20-2000 karakter.'), { status: 400 });
  if (!['text', 'pdf', 'docx'].includes(input.kind)) throw Object.assign(new Error('Format jurnal tidak didukung.'), { status: 400 });
  if (input.kind === 'text' && (content.length < 20 || Buffer.byteLength(content) > MAX_TEXT_BYTES)) throw Object.assign(new Error('Isi jurnal minimal 20 karakter dan maksimal 100 KB.'), { status: 400 });
  return { title, author, abstract, content };
}
function validatedFile(file, kind) {
  if (!file || typeof file.data !== 'string' || !file.name || file.name.length > 180) throw Object.assign(new Error('Pilih berkas jurnal yang valid.'), { status: 400 });
  const buffer = Buffer.from(file.data, 'base64');
  if (!buffer.length || buffer.length > MAX_FILE_SIZE || buffer.toString('base64') !== file.data) throw Object.assign(new Error('Berkas tidak valid atau ukurannya melebihi 10 MB.'), { status: 400 });
  const prefix = kind === 'pdf' ? buffer.subarray(0, 5).toString() === '%PDF-' : buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (!file.name.toLowerCase().endsWith(`.${kind}`) || !prefix || !MIME_TYPES[kind]) throw Object.assign(new Error(`Pilih dokumen ${kind.toUpperCase()} yang valid.`), { status: 400 });
  return buffer;
}
async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const method = req.method;
  const user = await sessionUser(req);
  const secure = Boolean(req.socket.encrypted);

  if (method === 'GET' && url.pathname === '/api/me') return send(res, 200, { user: user ? publicUser(user) : null });
  if (method === 'POST' && url.pathname === '/api/register') {
    const input = await body(req), email = normalizedEmail(input.email); validateCredentials(email, input.password);
    if (!isSameCode(input.registrationCode, (await readSettings()).registrationCode)) return send(res, 403, { error: 'Kode konfirmasi salah atau belum diatur. Minta kode kepada pengelola.' });
    const users = await readUsers();
    if (users.some(item => item.email === email)) return send(res, 409, { error: 'Email sudah terdaftar. Silakan masuk.' });
    const credential = await passwordHash(input.password);
    const { hash, ...account } = { uid: randomUUID(), email, displayName: email.split('@')[0], ...credential, role: 'member', isAnonymous: false, createdAt: Date.now() };
    users.push({ ...account, passwordHash: hash });
    await writeUsers(users); setSession(res, account, secure);
    return send(res, 201, { user: publicUser(account) });
  }
  if (method === 'POST' && url.pathname === '/api/login') {
    const input = await body(req), email = normalizedEmail(input.email);
    const account = (await readUsers()).find(item => item.email === email);
    if (!account || !await passwordMatches(String(input.password || ''), account)) return send(res, 401, { error: 'Email atau password tidak sesuai.' });
    setSession(res, account, secure); return send(res, 200, { user: publicUser(account) });
  }
  if (method === 'POST' && url.pathname === '/api/guest') {
    const guest = { uid: `guest-${randomUUID()}`, displayName: 'Tamu', isAnonymous: true };
    setSession(res, guest, secure); return send(res, 200, { user: publicUser(guest) });
  }
  if (method === 'POST' && url.pathname === '/api/logout') { clearSession(req, res); return send(res, 200, { ok: true }); }
  if (method === 'GET' && url.pathname === '/api/journals') {
    if (!user) return send(res, 401, { error: 'Masuk atau lanjutkan sebagai tamu untuk membaca jurnal.' });
    const journals = (await listJournals()).map(({ filePath, ...item }) => item);
    return send(res, 200, { journals });
  }
  if (method === 'POST' && url.pathname === '/api/journals') {
    if (!canPublish(user)) return send(res, user ? 403 : 401, { error: user ? 'Akun tamu hanya dapat membaca jurnal.' : 'Masuk sebagai anggota untuk mengunggah jurnal.' });
    const input = await body(req), fields = validateJournal(input);
    let fileBuffer = null, fileName = '', fileSize = 0;
    if (input.kind !== 'text') { fileBuffer = validatedFile(input.file, input.kind); fileName = path.basename(input.file.name); fileSize = fileBuffer.length; }
    const id = randomUUID(), folder = `${slug(fields.title)}-${id.slice(0, 8)}`, folderPath = path.join(journalsRoot, folder);
    await mkdir(folderPath, { recursive: false });
    const journal = { id, ...fields, category: input.category, kind: input.kind, ownerId: user.uid, createdAt: Date.now(), fileName, fileSize };
    try {
      if (fileBuffer) await writeFile(path.join(folderPath, `source.${input.kind}`), fileBuffer, { flag: 'wx' });
      await writeFile(path.join(folderPath, 'journal.json'), `${JSON.stringify(journal, null, 2)}\n`, { flag: 'wx' });
    } catch (error) { await rm(folderPath, { recursive: true, force: true }); throw error; }
    return send(res, 201, { id });
  }
  const journalMatch = url.pathname.match(/^\/api\/journals\/([\w-]+)$/);
  if (journalMatch && (method === 'PUT' || method === 'DELETE')) {
    if (!user) return send(res, 401, { error: 'Masuk terlebih dahulu untuk mengelola jurnal.' });
    const found = await findJournal(journalMatch[1]);
    if (!found) return send(res, 404, { error: 'Jurnal tidak ditemukan.' });
    if (!canManageJournal(user, found.journal)) return send(res, 403, { error: 'Kamu hanya dapat mengubah jurnal milikmu sendiri.' });
    if (method === 'DELETE') { await rm(found.folder, { recursive: true, force: true }); return send(res, 200, { ok: true }); }
    const input = await body(req), fields = validateJournal(input), previous = found.journal;
    let fileBuffer = null, fileName = '', fileSize = 0;
    if (input.kind !== 'text') {
      if (input.file) { fileBuffer = validatedFile(input.file, input.kind); fileName = path.basename(input.file.name); fileSize = fileBuffer.length; }
      else if (input.kind === previous.kind) { fileName = previous.fileName; fileSize = previous.fileSize; }
      else return send(res, 400, { error: 'Pilih berkas untuk format jurnal yang baru.' });
    }
    const updated = { ...previous, ...fields, category: input.category, kind: input.kind, fileName, fileSize, updatedAt: Date.now() };
    if (fileBuffer) {
      const tempPath = path.join(found.folder, `source.${input.kind}.tmp`);
      await writeFile(tempPath, fileBuffer, { flag: 'w' });
      await rename(tempPath, path.join(found.folder, `source.${input.kind}`));
    }
    if (previous.kind !== 'text' && previous.kind !== input.kind) await rm(path.join(found.folder, `source.${previous.kind}`), { force: true });
    const recordTemp = `${found.recordPath}.${randomUUID()}.tmp`;
    await writeFile(recordTemp, `${JSON.stringify(updated, null, 2)}\n`, { flag: 'wx' });
    await rename(recordTemp, found.recordPath);
    const newFolder = path.join(journalsRoot, `${slug(fields.title)}-${previous.id.slice(0, 8)}`);
    if (newFolder !== found.folder) await rename(found.folder, newFolder);
    return send(res, 200, { ok: true });
  }
  const fileMatch = url.pathname.match(/^\/api\/journals\/([\w-]+)\/file$/);
  if (method === 'GET' && fileMatch) {
    if (!user) return send(res, 401, { error: 'Masuk terlebih dahulu untuk membaca berkas.' });
    const found = await findJournal(fileMatch[1]);
    if (!found) return send(res, 404, { error: 'Jurnal tidak ditemukan.' });
    const { journal, folder } = found;
    if (journal.kind === 'text') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="${journal.id}.txt"` }); return res.end(journal.content); }
    const sourcePath = path.join(folder, `source.${journal.kind}`);
    if (!sourcePath) return send(res, 404, { error: 'Berkas jurnal tidak ditemukan.' });
    const data = await readFile(sourcePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[journal.kind], 'Content-Length': data.length, 'Content-Disposition': `attachment; filename="${encodeURIComponent(journal.fileName)}"`, 'Cache-Control': 'no-store' });
    return res.end(data);
  }
  return send(res, 404, { error: 'Alamat API tidak ditemukan.' });
}
export function localDatabase() {
  const middleware = (req, res, next) => {
    if (!req.url.startsWith('/api/')) return next();
    route(req, res).catch(error => { if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : 'Penyimpanan lokal mengalami kesalahan.' }); else res.destroy(error); });
  };
  return {
    name: 'local-file-database',
    configureServer(server) { readSettings().catch(error => server.config.logger.error(`File pengaturan lokal tidak dapat dibaca: ${error.message}`)); server.middlewares.use(middleware); },
    configurePreviewServer(server) { readSettings().catch(error => server.config.logger.error(`File pengaturan lokal tidak dapat dibaca: ${error.message}`)); server.middlewares.use(middleware); }
  };
}
