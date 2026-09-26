import { members, filterMembers } from './data.js';
import * as portal from './portal.js';

const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const icons = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  book: '<path d="M12 6c-3-2-7-2-10-1v14c3-1 7-1 10 1 3-2 7-2 10-1V5c-3-1-7-1-10 1Zm0 0v14"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1"/>',
  scales: '<path d="M12 3v18m-6 0h12M3 7h18M5 7 1 15h8L5 7Zm14 0-4 8h8l-4-8Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  column: '<path d="M3 5h18L12 1 3 5Zm0 3h18M5 9v10m4-10v10m6-10v10m4-10v10M3 21h18"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const photo = m => `<div class="portrait" style="--portrait-label:'${m.initials}'">${m.photo ? `<img src="/assets/${m.photo}.jpg" alt="Foto ilustrasi ${m.name}" loading="lazy">` : `<span class="portrait-placeholder" role="img" aria-label="Inisial ${m.name}; foto belum ditambahkan"></span>`}</div>`;
let memberQuery = '', division = 'Semua', journalQuery = '', category = 'Semua';
function session() { return portal.user; }

function header(route) {
  return `<header class="site-header"><div class="container nav-wrap">
    <a href="/" data-link class="brand" aria-label="Justitia, beranda"><span class="brand-symbol"><img src="/assets/justice.svg" alt="" width="29" height="36"></span><span>JUSTITIA<small>FAKULTAS HUKUM · ANGKATAN 2023</small></span></a>
    <button class="menu-toggle icon-button" aria-label="Buka menu navigasi" aria-expanded="false" aria-controls="main-nav">${icon('menu')}</button>
    <nav id="main-nav" aria-label="Navigasi utama">${[['/', 'Beranda'], ['/tentang', 'Tentang Kelas'], ['/struktur', 'Struktur Organisasi'], ['/jurnal', 'Jurnal Hukum']].map(([url, label]) => `<a href="${url}" data-link class="nav-link ${route === url ? 'active' : ''}" ${route === url ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
    ${session() ? `<button class="button small outline" data-logout>Keluar ${icon('arrow')}</button>` : `<a href="/login" data-link class="button small">${icon('lock')} Masuk Portal</a>`}</nav>
  </div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="container footer-top"><div><a href="/" data-link class="brand"><span class="brand-symbol"><img src="/assets/justice.svg" width="29" height="36" alt=""></span><span>JUSTITIA<small>FAKULTAS HUKUM · ANGKATAN 2023</small></span></a><p>Satu angkatan. Beragam pemikiran.<br>Satu komitmen untuk keadilan.</p></div><div class="footer-links"><span>JELAJAHI</span><a href="/tentang" data-link>Tentang kelas</a><a href="/struktur" data-link>Struktur organisasi</a><a href="/jurnal" data-link>Repositori jurnal</a></div><div class="footer-motto">${icon('column')}<p>Fiat justitia<br><em>ruat caelum.</em></p></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Justitia. Dibangun untuk tumbuh bersama.</span><span>Ilmu &middot; Integritas &middot; Solidaritas</span></div></footer>`;
}

function memberCard(m) {
  return `<button class="member-card" data-member="${m.id}" aria-label="Lihat profil ${m.name}">${photo(m)}<div class="member-info"><span class="eyebrow">${m.role}</span><h3>${m.name}</h3><p>NIM ${m.nim}</p><span class="profile-arrow">${icon('arrow')}</span></div></button>`;
}

function home() {
  return `<main id="main" tabindex="-1"><section class="hero"><div class="hero-photo" role="img" aria-label="Interior perpustakaan klasik dengan rak buku dan galeri megah"></div><div class="hero-overlay"></div><div class="container hero-inner"><div class="hero-content"><div class="eyebrow hero-eyebrow"><span></span> BERSAMA, MENJUNJUNG KEADILAN</div><h1>Berakar pada nilai.<br>Bertumbuh untuk<br><em>keadilan.</em></h1><p>Ruang bagi calon insan hukum untuk berpikir kritis,<br class="desktop-break"> berkarya, dan melangkah bersama membawa perubahan.</p><div class="hero-actions"><a href="/jurnal" data-link class="button light">Jelajahi Jurnal ${icon('arrow')}</a><a href="/struktur" data-link class="hero-secondary">Kenali kelas kami ${icon('arrow')}</a></div></div><div class="hero-seal"><img src="/assets/justice.svg" alt="Dewi Keadilan" width="62" height="78"><span>VERITAS · JUSTITIA</span></div><div class="hero-bottom"><span>FAKULTAS HUKUM</span><span>EST. 2023 <i></i> ANGKATAN XXIII</span><a href="#nilai" aria-label="Gulir ke nilai kami">GULIR UNTUK MENGENAL <span>↓</span></a></div></div></section>
  <section class="facts container" aria-label="Sekilas kelas"><div><span class="fact-icon">${icon('people')}</span><strong>${members.length}</strong><span>Anggota kelas<small>Bersama dalam satu visi</small></span></div><div><span class="fact-icon">${icon('book')}</span><strong>01</strong><span>Ruang berkarya<small>Gagasan yang terus tumbuh</small></span></div><div><span class="fact-icon">${icon('scales')}</span><strong>01</strong><span>Komitmen bersama<small>Ilmu untuk keadilan</small></span></div></section>
  <section class="section values-section" id="nilai"><div class="container values-grid"><div class="quote-panel"><div class="quote-mark">“</div><blockquote>Fiat justitia<br><em>ruat caelum.</em></blockquote><div class="thin-rule"></div><p>Hendaklah keadilan ditegakkan,<br>walaupun langit akan runtuh.</p><span class="eyebrow">PRINSIP YANG MENYATUKAN KAMI</span><img class="column-decoration" src="/assets/columns.svg" alt=""></div><div class="values-copy"><span class="eyebrow">LEBIH DARI SEKADAR RUANG KELAS</span><h2>Belajar hukum.<br>Merawat kemanusiaan.</h2><p>Kami percaya bahwa hukum tidak berhenti pada pasal dan teori. Ia hidup dalam keberanian untuk bertanya, kepedulian untuk mendengar, dan integritas untuk bertindak.</p><p>Justitia menjadi rumah bagi semangat itu. Tempat kami bertukar gagasan, membangun persaudaraan, dan mempersiapkan diri untuk mengabdi kepada masyarakat.</p><a href="/tentang" data-link class="text-link">Cerita & visi kami ${icon('arrow')}</a></div></div></section>
  <section class="section organization-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">ORANG-ORANG DI BALIK KELAS</span><h2>Bersama dalam satu arah.</h2></div><a href="/struktur" data-link class="text-link">Lihat struktur lengkap ${icon('arrow')}</a></div><div class="member-grid">${members.slice(0, 4).map(memberCard).join('')}</div></div></section>
  <section class="section journal-intro"><div class="container journal-banner"><div class="journal-art">${icon('book')}<span>LEX<br><em>SCRIPTA</em></span><div class="book-line"></div><small>RUANG GAGASAN & KAJIAN HUKUM</small></div><div class="journal-banner-copy"><span class="eyebrow">REPOSITORI AKADEMIK</span><h2>Pemikiran hari ini.<br>Perubahan esok hari.</h2><p>Telusuri perspektif, kajian, dan gagasan hukum dari ruang kelas kami. Karena setiap pemikiran layak untuk dibagikan.</p><a href="/jurnal" data-link class="button">Buka Repositori Jurnal ${icon('arrow')}</a><small>${icon('lock')} Terbuka untuk anggota dan tamu</small></div></div></section>
  <section class="closing"><div class="container"><span class="eyebrow">ILMU · INTEGRITAS · SOLIDARITAS</span><h2>Satu langkah bersama,<br>seribu kemungkinan di depan.</h2><a href="/struktur" data-link class="text-link">Temukan orang-orangnya ${icon('arrow')}</a></div></section></main>`;
}

function pageHeading(label, title, description) {
  return `<section class="page-heading"><div class="container"><span class="eyebrow">${label}</span><h1>${title}</h1><p>${description}</p></div><img src="/assets/columns.svg" class="page-columns" alt=""></section>`;
}
function structure() {
  return `<main id="main" tabindex="-1">${pageHeading('KENALI KELAS KAMI', 'Beragam peran. Satu tujuan.', 'Setiap kontribusi adalah bagian dari perjalanan kita bersama.')}<section class="section"><div class="container"><div class="section-heading compact"><div><span class="eyebrow">STRUKTUR ORGANISASI</span><h2>Penggerak di balik kebersamaan.</h2></div><span class="count-badge">${members.length} orang</span></div><div class="toolbar"><label class="search-box">${icon('search')}<input type="search" id="member-search" placeholder="Cari nama, NIM, atau jabatan…" aria-label="Cari anggota" value="${escape(memberQuery)}"></label><label class="select-field"><span>Kelompok / divisi</span><select id="division">${['Semua', 'Pengurus Inti', 'Akademik', 'Humas', 'Kreatif', 'Sosial', 'Anggota Kelas'].map(d => `<option ${division === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label></div><p id="member-count" class="result-count" aria-live="polite"></p><div id="member-results"></div></div></section></main>`;
}
function renderMembers() {
  const result = filterMembers(memberQuery, division);
  document.querySelector('#member-count').textContent = `${result.length} orang ditampilkan`;
  const target = document.querySelector('#member-results');
  if (!result.length) { target.innerHTML = emptyState('people', 'Anggota belum ditemukan', 'Coba nama lain atau pilih semua kelompok.', 'members'); return; }
  const full = !memberQuery.trim() && division === 'Semua';
  const byRole = (...roles) => result.filter(m => roles.includes(m.role)).map(memberCard).join('');
  target.innerHTML = full ? `<div class="org-tree"><div class="org-row leader">${byRole('Ketua Kelas')}</div><div class="org-row deputy">${byRole('Wakil Ketua Kelas')}</div><div class="org-row officers">${byRole('Sekretaris', 'Bendahara')}</div><div class="org-division-label"><span>KOORDINATOR DIVISI</span></div><div class="member-grid division-grid">${result.filter(m => m.role.startsWith('Koordinator ')).map(memberCard).join('')}</div><section class="class-members" aria-labelledby="class-members-title"><div class="org-division-label"><h3 id="class-members-title">ANGGOTA KELAS</h3></div><div class="member-grid class-member-grid">${byRole('Anggota Kelas')}</div></section></div>` : `<div class="member-grid">${result.map(memberCard).join('')}</div>`;
}
function emptyState(symbol, title, description, reset) {
  return `<div class="empty-state">${icon(symbol)}<h3>${title}</h3><p>${description}</p><button class="button outline" data-reset="${reset}">Reset pencarian</button></div>`;
}
function about() {
  return `<main id="main" tabindex="-1">${pageHeading('TENTANG JUSTITIA', 'Tumbuh bersama. Berarti bersama.', 'Sebuah ruang bagi ilmu, persahabatan, dan komitmen untuk keadilan.')}<section class="section"><div class="container about-grid"><div><span class="eyebrow">VISI KAMI</span><h2>Menjadi insan hukum<br>yang berintegritas.</h2><p class="large-copy">Membangun komunitas mahasiswa hukum yang kritis, inklusif, dan berempati, serta menghidupkan semangat keadilan melalui pengetahuan dan tindakan.</p><blockquote class="about-quote">“Fiat justitia ruat caelum.”<small>Hendaklah keadilan ditegakkan, walaupun langit akan runtuh.</small></blockquote></div><div class="mission-list"><span class="eyebrow">MISI KAMI</span>${[['01', 'Menghidupkan budaya akademik', 'Membuka ruang diskusi yang sehat, bertukar perspektif, dan menghasilkan karya tulis yang bermakna.'], ['02', 'Menguatkan solidaritas', 'Merawat lingkungan kelas yang saling mendukung dan memberi kesempatan setiap anggota untuk berkembang.'], ['03', 'Mengabdi dengan integritas', 'Menghubungkan pengetahuan hukum dengan kepedulian terhadap masyarakat dan tanggung jawab sosial.']].map(([n, h, p]) => `<article><span>${n}</span><div><h3>${h}</h3><p>${p}</p></div></article>`).join('')}</div></div></section><section class="closing"><div class="container"><span class="eyebrow">MULAI DARI KEBERSAMAAN</span><h2>Kenali wajah di balik gagasan.</h2><a href="/struktur" data-link class="button">Temui pengurus kelas ${icon('arrow')}</a></div></section></main>`;
}
function login() { return portal.loginPage(); }
function journalPage() { return portal.journalPage(journalQuery, category); }
function renderJournals() { portal.renderJournals(journalQuery, category); }
function navigate(url, replace = false) {
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
  render();
  window.scrollTo(0, 0);
  document.querySelector('#main')?.focus({ preventScroll: true });
}
function render() {
  modal.close();
  let route = location.pathname.replace(/\/$/, '') || '/';
  if (portal.authReady && route === '/jurnal' && !session()) { history.replaceState({}, '', '/login'); route = '/login'; }
  if (route === '/login' && session() && !session().isAnonymous) { history.replaceState({}, '', '/jurnal'); route = '/jurnal'; }
  if (!portal.authReady && ['/login', '/jurnal'].includes(route)) { app.innerHTML = header(route) + '<main id="main" class="empty-state" role="status"><p>Menyiapkan portal...</p></main>' + footer(); return; }
  const pages = { '/': home, '/struktur': structure, '/tentang': about, '/login': login, '/jurnal': journalPage };
  const titles = { '/': 'Beranda', '/struktur': 'Struktur Organisasi', '/tentang': 'Tentang Kelas', '/login': 'Masuk Portal', '/jurnal': 'Repositori Jurnal' };
  document.title = `${titles[route] || 'Halaman tidak ditemukan'} — Justitia`;
  app.innerHTML = header(route) + (pages[route] ? pages[route]() : `<main id="main" tabindex="-1" class="empty-state"><h1>Halaman tidak ditemukan.</h1><a href="/" data-link class="button">Kembali ke beranda</a></main>`) + footer();
  if (route === '/struktur') renderMembers();
  if (route === '/jurnal') {
    renderJournals();
  }
  if (route === '/login') portal.bindLogin();
  document.querySelectorAll('.portrait img').forEach(img => img.addEventListener('error', () => { img.style.opacity = '0'; }, { once: true }));
}
function showMember(id) {
  const m = members.find(m => m.id === Number(id));
  if (!m) return;
  modal.innerHTML = `<button class="modal-close icon-button" data-close aria-label="Tutup detail profil">${icon('close')}</button><div class="profile-modal">${photo(m)}<div class="profile-details"><span class="eyebrow">${m.division}</span><h2 id="modal-title">${m.name}</h2><p class="profile-role">${m.role}</p><p class="profile-nim">NIM ${m.nim}</p><p>${m.bio}</p>${m.linkedin ? `<a class="profile-social" href="${escape(m.linkedin)}" target="_blank" rel="noopener noreferrer"><span class="linkedin-mark">in</span><span>Kunjungi profil LinkedIn<small>Dibuka di tab baru</small></span>${icon('arrow')}</a>` : ''}</div></div>`;
  modal.showModal();
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-link]');
  if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); navigate(link.getAttribute('href')); return; }
  const el = event.target.closest('button');
  if (!el) return;
  portal.handleClick(el);
  if (el.matches('.menu-toggle')) { const open = el.getAttribute('aria-expanded') !== 'true'; el.setAttribute('aria-expanded', String(open)); el.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi'); document.querySelector('#main-nav').classList.toggle('is-open', open); }
  if (el.dataset.member) showMember(el.dataset.member);
  if (el.hasAttribute('data-close') && portal.canCloseModal()) modal.close();
  if (el.dataset.category) { category = el.dataset.category; document.querySelectorAll('[data-category]').forEach(b => { b.classList.toggle('selected', b.dataset.category === category); b.setAttribute('aria-pressed', String(b.dataset.category === category)); }); renderJournals(); }
  if (el.dataset.reset === 'members') { memberQuery = ''; division = 'Semua'; document.querySelector('#member-search').value = ''; document.querySelector('#division').value = 'Semua'; renderMembers(); }
  if (el.dataset.reset === 'journals') { journalQuery = ''; category = 'Semua'; render(); }
  if (el.id === 'toggle-password') { const input = document.querySelector('#password'); const reveal = input.type === 'password'; input.type = reveal ? 'text' : 'password'; el.setAttribute('aria-label', reveal ? 'Sembunyikan password' : 'Tampilkan password'); el.setAttribute('aria-pressed', String(reveal)); }
});
document.addEventListener('input', event => {
  if (event.target.id === 'member-search') { memberQuery = event.target.value; renderMembers(); }
  if (event.target.id === 'journal-search') { journalQuery = event.target.value; renderJournals(); }
});
document.addEventListener('change', event => { if (event.target.id === 'division') { division = event.target.value; renderMembers(); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { document.querySelector('#main-nav')?.classList.remove('is-open'); document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false'); } });
modal.addEventListener('click', event => { if (event.target === modal && portal.canCloseModal()) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close(); } });
window.addEventListener('popstate', render);
render();

portal.initializePortal({ icon, escape, navigate, render, renderJournals, modal, pageHeading, emptyState, resetJournalFilters: () => { journalQuery = ''; category = 'Semua'; if (location.pathname === '/jurnal') render(); } });
