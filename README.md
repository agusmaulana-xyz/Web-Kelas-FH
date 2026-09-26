# Justitia — Website Kelas Fakultas Hukum

Implementasi responsif berdasarkan `task.md`, menggunakan HTML, CSS, JavaScript ES modules, dan server statis Node.js tanpa dependensi runtime.

## Menjalankan

Memerlukan Node.js 20 atau lebih baru.

```sh
node server.mjs
```

Buka http://localhost:3000. Alternatif: `npm start` atau `npm run dev`. Di PowerShell yang memblokir `npm.ps1`, gunakan `npm.cmd start`. Port bisa diatur lewat variabel lingkungan `PORT`.

## Halaman & fitur

- `/`: beranda, kutipan, pengurus, dan pintu masuk repositori.
- `/tentang`: visi dan misi kelas.
- `/struktur`: bagan pengurus inti, koordinator divisi, dan daftar anggota kelas; pencarian nama/NIM/jabatan, filter kelompok/divisi, serta modal profil. Tersedia 8 pengurus dan 8 anggota contoh; anggota tanpa foto menggunakan inisial.
- `/login`: validasi form, tampil/sembunyikan password, akun demo.
- `/jurnal`: pencarian judul/penulis, filter kategori, pratinjau dan unduh PDF yang dihasilkan dari masing-masing naskah contoh.

**Akun demo:** `mahasiswa` (atau `mahasiswa@justitia.demo`) / `Justitia2023!`.

Sesi demo menggunakan token acak di `sessionStorage`, berlaku 2 jam, dihapus saat logout, dan diperiksa saat navigasi/akses jurnal. Route jurnal tanpa sesi diarahkan ke login. Ini **mockup autentikasi frontend**, sesuai Task 4 dalam spesifikasi, bukan keamanan produksi. Data contoh tetap dikirim ke browser; sebelum memuat dokumen privat, implementasikan autentikasi dan otorisasi pada server serta penyimpanan dokumen privat.

## Mengganti konten

- `public/data.js`: nama, NIM, jabatan, divisi, foto, dan jurnal. Semua identitas merupakan contoh. Link LinkedIn belum diisi agar tidak mengarahkan ke akun orang lain; isi properti `linkedin` pada setiap anggota dengan URL profil asli untuk menampilkan tautannya.
- `public/app.js`: nama kelas, angkatan, narasi, dan struktur halaman.
- `public/styles.css`: warna, font, layout, dan breakpoint responsif.
- `public/assets/`: ikon Dewi Keadilan dan ornamen pilar SVG lokal.
- `public/pdf.js`: generator PDF satu halaman untuk konten demonstrasi.

Font DM Sans dan Playfair Display berasal dari Google Fonts; foto ilustrasi berasal dari Unsplash. Salinan aset tersedia lokal di `public/assets/`, sehingga tampilan tidak memerlukan koneksi ke layanan tersebut. Ganti foto dengan aset institusi yang telah mendapat izin sebelum publikasi.

## Pemeriksaan

```sh
npm.cmd test
```

Pengujian mencakup kombinasi pencarian/filter serta struktur dan offset dokumen PDF. Server melayani rute aplikasi secara langsung sehingga refresh `/struktur` atau `/jurnal` tetap bekerja.

Pengujian browser (memerlukan Google Chrome terpasang):

```sh
npm.cmd install
npm.cmd run test:e2e
```

Menguji navigasi desktop/ponsel, modal dan filter anggota, validasi login, sesi kedaluwarsa, kategori jurnal, unduh PDF, serta logout. Screenshot dan PDF hasil uji disimpan di `artifacts/`.
