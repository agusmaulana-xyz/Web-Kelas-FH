# Justice After Dark — Kelas Reguler Malam FH UPB 2026

Website kelas Fakultas Hukum Universitas Pelita Bangsa, dengan profil kelas dan portal repositori jurnal.

## Development lokal

Perlu Node.js 22.12 atau lebih baru.

```powershell
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:3000`. Akun, sesi, dan jurnal lokal disimpan pada folder `data/`. Detail kode pendaftaran, role superadmin, dan aturan akses portal ada pada berkas data lokal; jangan mengunggah `data/` ke repositori publik.

## Deploy situs ke Vercel

Project menggunakan Vite. Impor repositori di Vercel dengan **Framework Preset: Vite**, **Build Command: `npm run build`**, dan **Output Directory: `dist`**. Berkas `vercel.json` mengarahkan URL halaman tunggal serta menyediakan `/sitemap.xml` dan `/robots.txt`.

Atur environment variable `SITE_URL` ke alamat production penuh, misalnya `https://nama-domain-anda.id` (tanpa garis miring di akhir). Deploy ulang setelah mengubah environment variable. Sitemap berisi halaman publik Beranda, Tentang, dan Struktur.

### Batas penting portal pada Vercel

Deploy Vite akan menayangkan situs publik, tetapi portal login dan API jurnal saat ini masih dijalankan oleh middleware Vite lokal di `scripts/local-database.mjs`. Middleware itu membaca/menulis file dalam `data/`, menyimpan sesi di memori proses, dan **belum menjadi Vercel Function**. File lokal maupun memori fungsi Vercel tidak menyediakan penyimpanan bersama yang persisten. Karena itu login, pendaftaran, dan perubahan jurnal tidak akan bekerja dengan andal jika langsung dipindahkan ke Vercel.

Agar portal bekerja setelah deploy, backend perlu dipindahkan ke Vercel Functions dengan database bersama untuk akun/jurnal dan penyimpanan objek privat untuk PDF/DOCX. Data `data/` yang ada juga perlu dimigrasikan. Project ini tidak menggunakan Firebase; database dan storage persisten perlu dibuat/dihubungkan di Vercel sebelum portal bisa dinyatakan siap production. Jangan gunakan akun superadmin production sebelum pemindahan dan pengujian backend tersebut.

## Agar ditemukan Google

Metadata halaman, teks halaman depan yang menyebut Kelas Reguler Malam Angkatan 2026 Fakultas Hukum Universitas Pelita Bangsa, canonical URL, `robots.txt`, dan sitemap disiapkan untuk SEO teknis. Setelah domain aktif:

1. Pastikan `SITE_URL` sama persis dengan domain utama yang dipakai (termasuk `https://`), lalu deploy ulang.
2. Tambahkan domain di Google Search Console dan selesaikan verifikasi kepemilikan.
3. Kirim `https://domain-anda/sitemap.xml` di Search Console.
4. Lengkapi konten publik yang bermanfaat dan tautkan situs dari kanal resmi kampus/kelas.

Pengindeksan dan urutan hasil pencarian ditentukan Google. Sitemap, metadata, dan kata kunci membantu Google memahami situs, tetapi tidak menjamin situs langsung muncul atau menjadi hasil teratas.
