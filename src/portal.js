import * as cloud from './firebase-client.js';
import { categories, filterJournalList, friendlyError, MAX_TEXT_BYTES } from './journal-model.js';

export let user = null;
export let authReady = false;
let journals = [], loading = false, loadError = '', unsubscribe;
let ui, authMode = 'login', uploadBusy = false, previewUrl, previewRequest = 0;
const kindLabel = kind => ({ text: 'Teks', pdf: 'PDF', docx: 'DOCX' }[kind] || 'Dokumen');
const dateLabel = value => value?.toDate ? value.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja';
const fileSize = size => size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
const e = value => ui.escape(value ?? '');
const i = name => ui.icon(name);

export function initializePortal(options) {
  ui = options;
  cloud.watchAuth(next => {
    user = next; authReady = true;
    unsubscribe?.(); unsubscribe = null; journals = []; loadError = ''; loading = Boolean(user);
    ui.render();
    if (user) subscribe();
  }, error => { user = null; authReady = true; loading = false; ui.render(); notify(friendlyError(error), true); });
  ui.modal.addEventListener('close', () => { previewRequest++; if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; });
  ui.modal.addEventListener('cancel', event => { if (uploadBusy) event.preventDefault(); });
}
function subscribe() {
  unsubscribe?.();
  loading = true; loadError = '';
  try {
    unsubscribe = cloud.watchJournals(items => { journals = items; loading = false; ui.renderJournals(); }, error => { loading = false; loadError = friendlyError(error); ui.renderJournals(); });
  } catch (error) { loading = false; loadError = friendlyError(error); ui.renderJournals(); }
}
export function canCloseModal() { return !uploadBusy; }
export function notify(message, error = false) {
  let region = document.querySelector('#notification');
  if (!region) { region = document.createElement('div'); region.id = 'notification'; region.setAttribute('role', 'status'); document.body.append(region); }
  region.textContent = message; region.className = `notification ${error ? 'notification-error' : ''}`;
  clearTimeout(notify.timer); notify.timer = setTimeout(() => region.remove(), 6000);
}
export function loginPage() {
  const register = authMode === 'register';
  return `<main id="main" tabindex="-1" class="login-main"><section class="login-story"><img src="/assets/justice.svg" class="login-justice" alt="Dewi Keadilan"><span class="eyebrow">PORTAL AKADEMIK JUSTITIA</span><h1>Ilmu dibagikan.<br><em>Gagasan dihidupkan.</em></h1><p>Temukan perspektif baru.<br>Bagikan karya dan pemikiranmu.</p><blockquote>“Fiat justitia ruat caelum.”</blockquote><img src="/assets/columns.svg" class="login-columns" alt=""></section><section class="login-form-side"><form id="login-form" novalidate><span class="eyebrow">RUANG BELAJAR BERSAMA</span><h2>${register ? 'Buat akunmu.' : 'Masuk ke portal.'}</h2><p>Baca dan bagikan jurnal bersama kelas.</p><button type="button" class="button google-button" data-google><span class="google-mark" aria-hidden="true">G</span> Lanjutkan dengan Google</button><div class="form-divider"><span>atau gunakan email</span></div><label class="form-label" for="email">Email</label><div class="form-input">${i('mail')}<input id="email" name="email" type="email" autocomplete="email" placeholder="nama@email.com" required maxlength="254" aria-describedby="email-error"></div><small id="email-error" class="field-error"></small><label class="form-label" for="password">Password</label><div class="form-input">${i('lock')}<input id="password" name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="${register ? 'Minimal 8 karakter' : 'Masukkan password'}" required maxlength="128" aria-describedby="password-error"><button type="button" id="toggle-password" class="icon-button" aria-label="Tampilkan password" aria-pressed="false">${i('eye')}</button></div><small id="password-error" class="field-error"></small>${register ? '' : '<button type="button" class="forgot-password" data-reset-password>Lupa password?</button>'}<p id="login-error" class="form-error" role="alert"></p><p id="login-status" class="form-status" role="status"></p><button type="submit" class="button login-submit">${register ? 'Daftar akun' : 'Masuk'} ${i('arrow')}</button><p class="auth-switch">${register ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" data-auth-mode="${register ? 'login' : 'register'}">${register ? 'Masuk' : 'Daftar sekarang'}</button></p><button type="button" class="button outline guest-button" data-guest>Lanjutkan sebagai tamu ${i('arrow')}</button><p class="guest-note">Tamu dapat membaca dan mengunggah jurnal.</p><a href="/" data-link class="back-link">← Kembali ke beranda</a></form></section></main>`;
}
function validateEmail() {
  const input = document.querySelector('#email');
  const email = input.value.trim();
  const error = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Masukkan alamat email yang valid.' : '';
  document.querySelector('#email-error').textContent = error;
  input.setAttribute('aria-invalid', String(Boolean(error)));
  if (error) { input.focus(); return null; }
  return email;
}
async function authAction(action) {
  const form = document.querySelector('#login-form');
  if (!form || form.getAttribute('aria-busy') === 'true') return;
  const error = form.querySelector('#login-error'), status = form.querySelector('#login-status');
  error.textContent = ''; status.textContent = 'Menghubungkan…';
  form.setAttribute('aria-busy', 'true'); form.querySelectorAll('button').forEach(b => b.disabled = true);
  try { await action(); }
  catch (failure) { error.textContent = friendlyError(failure); }
  finally { status.textContent = ''; form.removeAttribute('aria-busy'); form.querySelectorAll('button').forEach(b => b.disabled = false); }
}
export function bindLogin() {
  document.querySelector('#login-form').addEventListener('submit', event => {
    event.preventDefault();
    const email = validateEmail();
    const password = document.querySelector('#password');
    const error = password.value.length < (authMode === 'register' ? 8 : 1) ? (authMode === 'register' ? 'Password minimal 8 karakter.' : 'Masukkan password.') : '';
    document.querySelector('#password-error').textContent = error;
    password.setAttribute('aria-invalid', String(Boolean(error)));
    if (!email || error) { if (email) password.focus(); return; }
    const action = authMode === 'register' ? cloud.registerEmail : cloud.loginEmail;
    authAction(async () => { await action(email, password.value); ui.navigate('/jurnal', true); });
  });
}
export function journalPage(query, category) {
  return `<main id="main" tabindex="-1">${ui.pageHeading('RUANG GAGASAN & KAJIAN', 'Repositori jurnal hukum.', 'Membaca untuk memahami. Menulis untuk berkontribusi.')}<section class="section"><div class="container"><div class="portal-welcome"><span>${i('check')} Selamat datang, ${e(user?.isAnonymous ? 'Tamu' : user?.displayName || user?.email || 'Anggota')}</span>${user?.isAnonymous ? '<a href="/login" data-link class="text-link">Masuk atau buat akun</a>' : '<span>Ruang karya bersama</span>'}</div><div class="toolbar"><label class="search-box">${i('search')}<input type="search" id="journal-search" placeholder="Cari judul jurnal atau nama penulis…" aria-label="Cari jurnal" value="${e(query)}"></label><button class="button upload-open" data-upload>+ Unggah Jurnal</button></div><div class="category-tabs" aria-label="Kategori jurnal">${['Semua', ...categories].map(c => `<button class="category-tab ${category === c ? 'selected' : ''}" aria-pressed="${category === c}" data-category="${c}">${c}</button>`).join('')}</div><p id="journal-count" class="result-count" aria-live="polite"></p><div id="journal-results" class="journal-grid"></div></div></section></main>`;
}
export function renderJournals(query, category) {
  const target = document.querySelector('#journal-results');
  if (!target) return;
  const count = document.querySelector('#journal-count');
  count.textContent = '';
  if (loading) { target.innerHTML = '<div class="empty-state" role="status"><p>Memuat jurnal…</p></div>'; return; }
  if (loadError) { target.innerHTML = `<div class="empty-state" role="alert"><h3>Jurnal belum dapat dimuat.</h3><p>${e(loadError)}</p><button class="button outline" data-retry-journals>Coba lagi</button></div>`; return; }
  const result = filterJournalList(journals, query, category);
  count.textContent = `${result.length} jurnal ditampilkan`;
  if (!journals.length) { target.innerHTML = `<div class="empty-state">${i('book')}<h3>Gagasan pertamamu dimulai di sini.</h3><p>Bagikan jurnal dalam bentuk teks, PDF, atau DOCX.</p><button class="button" data-upload>Unggah Jurnal</button></div>`; return; }
  target.innerHTML = result.length ? result.map(j => `<article class="journal-card"><div class="journal-card-top"><span class="journal-category">${e(j.category)}</span>${i('book')}</div><span class="journal-edition">${kindLabel(j.kind)} · JURNAL KELAS</span><h2>${e(j.title)}</h2><p class="journal-author">${e(j.author)}</p><p class="journal-excerpt">${e(j.abstract)}</p><div class="journal-meta"><span>${dateLabel(j.createdAt)}</span><span>${j.fileSize ? fileSize(j.fileSize) : 'Artikel teks'}</span></div><div class="journal-actions"><button class="text-link" data-preview="${e(j.id)}">${i('eye')} Pratinjau</button><button class="download-button" data-download="${e(j.id)}" aria-label="Unduh ${e(j.title)}">${i('download')} Unduh ${kindLabel(j.kind)}</button></div></article>`).join('') : ui.emptyState('book', 'Jurnal belum ditemukan', 'Gunakan kata kunci lain atau ubah kategori jurnal.', 'journals');
}
export function showUpload() {
  if (!user) { ui.navigate('/login'); return; }
  ui.modal.innerHTML = `<button class="modal-close icon-button" data-close aria-label="Tutup unggah jurnal">${i('close')}</button><form id="upload-form" class="upload-form"><span class="eyebrow">BAGIKAN PEMIKIRANMU</span><h2 id="modal-title">Unggah jurnal.</h2><p>Lengkapi informasi karya agar mudah ditemukan oleh teman sekelas.</p><label class="form-label" for="journal-title">Judul jurnal</label><input class="upload-input" id="journal-title" name="title" required minlength="5" maxlength="180" placeholder="Judul karya tulismu"><div class="upload-fields"><div><label class="form-label" for="journal-author">Nama penulis</label><input class="upload-input" id="journal-author" name="author" required minlength="2" maxlength="100" value="${e(user.displayName || '')}" placeholder="Nama lengkap penulis"></div><div><label class="form-label" for="journal-category">Kategori</label><select class="upload-input" id="journal-category" name="category" required><option value="">Pilih kategori</option>${categories.map(c => `<option>${c}</option>`).join('')}</select></div></div><label class="form-label" for="journal-abstract">Ringkasan</label><textarea class="upload-input" id="journal-abstract" name="abstract" rows="3" required minlength="20" maxlength="2000" placeholder="Gambaran singkat tentang pembahasan jurnal"></textarea><fieldset class="upload-kind"><legend>Format jurnal</legend>${[['text', 'Tulis teks'], ['pdf', 'PDF'], ['docx', 'DOCX']].map(([value, label]) => `<label><input type="radio" name="kind" value="${value}" ${value === 'text' ? 'checked' : ''}> ${label}</label>`).join('')}</fieldset><div id="text-fields"><label class="form-label" for="journal-content">Isi jurnal</label><textarea class="upload-input" id="journal-content" name="content" rows="8" minlength="20" maxlength="100000" required placeholder="Tuliskan isi jurnal di sini…"></textarea><label class="text-import">Atau impor berkas .txt <input type="file" id="text-file" accept=".txt,text/plain"></label><small class="input-help">Minimal 20 karakter · Maksimal 100 KB</small></div><div id="file-fields" hidden><label class="file-drop" for="journal-file">${i('book')}<strong>Pilih berkas jurnal</strong><span id="file-label">PDF · Maksimal 10 MB</span><input id="journal-file" type="file" accept=".pdf,application/pdf"></label><small class="input-help">Dokumen asli dapat diunduh oleh pembaca jurnal.</small></div><p id="upload-error" class="form-error" role="alert"></p><div id="upload-progress" hidden><progress max="100" value="0" aria-label="Progres unggahan"></progress><p role="status">Menyiapkan unggahan…</p></div><div class="upload-footer"><button type="button" class="button outline" data-close>Batal</button><button type="submit" class="button">Terbitkan jurnal ${i('arrow')}</button></div></form>`;
  ui.modal.showModal();
  const form = document.querySelector('#upload-form');
  form.addEventListener('change', async event => {
    const error = form.querySelector('#upload-error'); error.textContent = '';
    const kind = form.elements.kind.value;
    if (event.target.name === 'kind') {
      form.querySelector('#text-fields').hidden = kind !== 'text';
      form.querySelector('#file-fields').hidden = kind === 'text';
      form.elements.content.required = kind === 'text';
      form.elements.content.disabled = kind !== 'text';
      const file = form.querySelector('#journal-file'); file.required = kind !== 'text'; file.value = '';
      file.accept = kind === 'pdf' ? '.pdf,application/pdf' : '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      form.querySelector('#file-label').textContent = `${kindLabel(kind)} · Maksimal 10 MB`;
    }
    if (event.target.id === 'journal-file') form.querySelector('#file-label').textContent = event.target.files[0]?.name || `${kindLabel(kind)} · Maksimal 10 MB`;
    if (event.target.id === 'text-file') {
      const file = event.target.files[0]; if (!file) return;
      if (!file.name.toLowerCase().endsWith('.txt') || file.size > MAX_TEXT_BYTES) { error.textContent = 'Pilih berkas .txt maksimal 100 KB.'; event.target.value = ''; return; }
      try { form.elements.content.value = await file.text(); }
      catch { error.textContent = 'Berkas teks tidak dapat dibaca.'; }
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (uploadBusy) return;
    const input = Object.fromEntries(new FormData(form));
    input.content ||= '';
    const file = form.querySelector('#journal-file').files[0];
    const error = form.querySelector('#upload-error'); error.textContent = '';
    const progress = form.querySelector('#upload-progress'); progress.hidden = false;
    uploadBusy = true; form.setAttribute('aria-busy', 'true');
    ui.modal.querySelectorAll('button, input, select, textarea').forEach(el => el.disabled = true);
    try {
      await cloud.publishJournal(input, file, value => { progress.querySelector('progress').value = value; progress.querySelector('p').textContent = value < 95 ? `Mengunggah berkas… ${value}%` : 'Menyimpan jurnal…'; });
      uploadBusy = false; ui.modal.close(); notify('Jurnal berhasil diterbitkan.'); ui.resetJournalFilters();
    } catch (failure) { error.textContent = friendlyError(failure); progress.hidden = true; }
    finally { uploadBusy = false; form.removeAttribute('aria-busy'); ui.modal.querySelectorAll('button, input, select, textarea').forEach(el => el.disabled = false); if (form.isConnected) form.elements.content.disabled = form.elements.kind.value !== 'text'; }
  });
}
export async function showJournal(id) {
  if (!user) { ui.navigate('/login'); return; }
  const journal = journals.find(j => j.id === id); if (!journal) return;
  if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null;
  const request = ++previewRequest;
  ui.modal.innerHTML = `<button class="modal-close icon-button" data-close aria-label="Tutup pratinjau">${i('close')}</button><div class="preview-modal"><span class="eyebrow">${e(journal.category)} · ${kindLabel(journal.kind)}</span><h2 id="modal-title">${e(journal.title)}</h2><p class="journal-author">${e(journal.author)} · ${dateLabel(journal.createdAt)}</p><h3>Ringkasan</h3><p>${e(journal.abstract)}</p>${journal.kind === 'text' ? `<h3>Isi jurnal</h3><div class="journal-full-text">${e(journal.content)}</div>` : journal.kind === 'pdf' ? '<div id="document-preview" class="document-preview" role="status">Memuat PDF…</div>' : '<div class="document-note">Dokumen DOCX tersedia untuk diunduh dan dibuka di Microsoft Word atau aplikasi pengolah dokumen.</div>'}<button class="button" data-download="${e(journal.id)}">${i('download')} Unduh ${kindLabel(journal.kind)}</button></div>`;
  ui.modal.showModal();
  if (journal.kind === 'pdf') {
    try {
      const blob = await cloud.journalBlob(journal);
      if (request !== previewRequest || !ui.modal.open) return;
      previewUrl = URL.createObjectURL(blob);
      document.querySelector('#document-preview').innerHTML = `<iframe src="${previewUrl}" title="Pratinjau dokumen PDF"></iframe><p>Jika pratinjau tidak tampil, gunakan tombol unduh.</p>`;
    } catch (error) { if (request === previewRequest && document.querySelector('#document-preview')) document.querySelector('#document-preview').textContent = friendlyError(error); }
  }
}
export async function downloadJournal(id, button) {
  if (!user) { ui.navigate('/login'); return; }
  const journal = journals.find(j => j.id === id); if (!journal) return;
  button.disabled = true;
  try {
    const blob = await cloud.journalBlob(journal);
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = journal.fileName || `${journal.title.replace(/[<>:"/\\|?*]/g, '-').slice(0, 100)}.txt`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) { notify(friendlyError(error), true); }
  finally { button.disabled = false; }
}
export function handleClick(button) {
  if (button.hasAttribute('data-google')) authAction(async () => { await cloud.loginGoogle(); ui.navigate('/jurnal', true); });
  if (button.hasAttribute('data-guest')) authAction(async () => { if (!user) await cloud.loginGuest(); ui.navigate('/jurnal', true); });
  if (button.hasAttribute('data-auth-mode')) { authMode = button.dataset.authMode; ui.render(); }
  if (button.hasAttribute('data-reset-password')) {
    const email = validateEmail(); if (!email) return;
    authAction(async () => { await cloud.resetPassword(email); notify('Jika email terdaftar, tautan reset password akan dikirim.'); });
  }
  if (button.hasAttribute('data-logout')) { button.disabled = true; cloud.logout().then(() => ui.navigate('/login', true)).catch(error => { button.disabled = false; notify(friendlyError(error), true); }); }
  if (button.hasAttribute('data-upload')) showUpload();
  if (button.hasAttribute('data-retry-journals')) { subscribe(); ui.renderJournals(); }
  if (button.dataset.preview) showJournal(button.dataset.preview);
  if (button.dataset.download) downloadJournal(button.dataset.download, button);
}
