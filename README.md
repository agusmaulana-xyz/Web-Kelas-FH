# Justitia — Website Kelas Fakultas Hukum

Website responsif berbasis Vite dan JavaScript, siap dibangun sebagai website statis di Vercel. Firebase menangani akun, database jurnal, dan berkas unggahan. Tidak membutuhkan server Node yang terus berjalan di Vercel.

## Fitur

- Beranda, visi/misi, bagan pengurus, divisi, dan anggota kelas.
- Login Google, email/password, pendaftaran akun, reset password, dan logout.
- **Tamu dapat membaca dan mengunggah jurnal**, melalui Firebase Anonymous Authentication.
- Jurnal teks (ketik langsung atau impor `.txt`), PDF, dan DOCX.
- Pencarian judul/penulis, kategori, pratinjau teks/PDF, serta unduh berkas asli. DOCX menampilkan ringkasan dan dapat diunduh untuk dibuka di Word.
- Jurnal disimpan di Firestore dan diperbarui secara realtime; berkas PDF/DOCX disimpan di Cloud Storage.
- Batas berkas PDF/DOCX **10 MB**, teks **100 KB**, judul 180 karakter, ringkasan 2.000 karakter.

Belum ada proyek Firebase atau deployment Vercel yang dibuat otomatis. Ikuti konfigurasi di bawah untuk mengaktifkan login dan penyimpanan. Tanpa konfigurasi, halaman umum tetap bekerja dan portal menampilkan pesan layanan belum tersedia; tidak ada akun atau penyimpanan palsu.

## 1. Menjalankan proyek lokal

Gunakan Node.js **22.12+** (disarankan Node.js 24 LTS).

```powershell
npm.cmd install
Copy-Item .env.example .env.local
```

Isi `.env.local` setelah menyelesaikan setup Firebase berikut, lalu:

```powershell
npm.cmd run dev
```

Buka **http://localhost:3000**. Di macOS/Linux, gunakan `npm` dan `cp .env.example .env.local`. Perintah lama `node server.mjs` juga menjalankan Vite.

## 2. Membuat proyek Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru. Google Analytics opsional.
2. Buka **Project settings → General → Your apps**, pilih ikon **Web (`</>`)**, daftarkan aplikasi bernama `Justitia`. Firebase Hosting tidak perlu diaktifkan karena website memakai Vercel.
3. Pilih konfigurasi SDK dan salin nilai objek `firebaseConfig` ke `.env.local` sesuai tabel berikut.

| Nilai Firebase Web App | Variabel di `.env.local` dan Vercel |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Contoh bentuk konfigurasi (ganti semua placeholder, jangan salin sebagai nilai asli):

```dotenv
VITE_FIREBASE_API_KEY=ISI_API_KEY_WEB_APP
VITE_FIREBASE_AUTH_DOMAIN=PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=NAMA_BUCKET_DARI_FIREBASE
VITE_FIREBASE_MESSAGING_SENDER_ID=ISI_SENDER_ID
VITE_FIREBASE_APP_ID=ISI_APP_ID
VITE_USE_FIREBASE_EMULATORS=false
```

Gunakan nama bucket persis dari Console, tanpa awalan `gs://`. Bucket baru umumnya berakhiran `.firebasestorage.app`; bucket lama dapat berakhiran `.appspot.com`. Jangan mengganti `authDomain` dengan domain Vercel.

Variabel `VITE_*` memang dimasukkan ke JavaScript browser. Isi hanya konfigurasi **Web App**; jangan memasukkan private key, JSON service account, atau kredensial Admin SDK. Akses data dikendalikan oleh Firebase Security Rules. `.env.local` sudah diabaikan oleh Git.

## 3. Mengaktifkan login

Di **Authentication → Get started → Sign-in method / Sign-in providers**, aktifkan:

1. **Google**: pilih email dukungan proyek, lalu simpan.
2. **Email/Password**: aktifkan metode password; email link tidak diperlukan.
3. **Anonymous**: wajib untuk tombol **Lanjutkan sebagai tamu**.

Di **Authentication → Settings → Authorized domains**, tambahkan:

- `localhost` dan `127.0.0.1` untuk pengembangan lokal.
- Domain produksi Vercel, misalnya `justitia-kelas.vercel.app` (tanpa `https://`).
- Domain kustom, jika digunakan.
- Domain preview Vercel yang benar-benar ingin dipakai menguji login; setiap domain preview perlu didaftarkan.

Login Google menggunakan pop-up. Izinkan pop-up jika browser memblokirnya. Alur implementasi mengikuti [dokumentasi Google Sign-In Firebase](https://firebase.google.com/docs/auth/web/google-signin).

Tamu memperoleh UID Firebase asli. Ketika tamu membuat akun email baru atau menghubungkan akun Google baru, akun anonim ditautkan agar UID tetap sama. Jika masuk ke akun yang sudah ada, identitas mengikuti akun tersebut; unggahan lama tetap tersedia untuk dibaca. Sesi dipulihkan oleh Firebase saat refresh, bukan token buatan di `sessionStorage`.

## 4. Membuat Firestore dan Cloud Storage

1. **Build → Firestore Database → Create database**: gunakan database **`(default)`**, edisi Standard/native, pilih lokasi, dan mulai dalam **Production mode**. Koleksi `journals` dibuat otomatis saat unggahan pertama berhasil.
2. **Build → Storage → Get started**: buat bucket dan salin namanya ke `VITE_FIREBASE_STORAGE_BUCKET`.

Cloud Storage Firebase memerlukan paket **Blaze** dengan billing terhubung. Teks tetap disimpan di Firestore, sedangkan unggahan PDF/DOCX memerlukan bucket aktif. Lihat [persyaratan billing Cloud Storage Firebase](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

Pasang aturan akses yang disediakan sebelum menguji unggahan:

```powershell
npx.cmd firebase login
npx.cmd firebase deploy --only "firestore:rules,firestore:indexes,storage" --project PROJECT_ID
```

Ganti `PROJECT_ID` dengan ID proyek asli. CLI sudah menjadi dependensi pengembangan, jadi tidak perlu instalasi global. Alternatif tanpa CLI: salin `firestore.rules` ke tab **Firestore → Rules** dan `storage.rules` ke **Storage → Rules**, lalu klik **Publish**.

Aturan saat ini sesuai akses tamu yang diminta:

- Akun Google/email dan akun anonim boleh membaca serta membuat jurnal.
- Pengunjung harus masuk atau memilih tamu sebelum mengakses jurnal.
- UID pemilik, format data, kategori, ukuran, jenis MIME, dan lokasi berkas divalidasi oleh rules.
- Penulisan berkas hanya di folder UID sendiri; jurnal yang sudah diterbitkan tidak dapat ditimpa dari aplikasi.
- Pengelola dapat menghapus/memperbaiki konten melalui Firebase Console. Fitur edit/hapus jurnal belum ditambahkan ke UI.

Karena akses tamu terbuka, jurnal bukan repositori rahasia khusus mahasiswa terverifikasi. Validasi berkas memeriksa ukuran, ekstensi, dan signature dasar; aplikasi tidak melakukan pemindaian malware atau moderasi otomatis.

## 5. Mengatur CORS untuk pratinjau dan unduh

Website memakai `getBlob()` agar akses berkas diperiksa oleh Storage Rules. Metode ini membutuhkan konfigurasi CORS bucket, sesuai [dokumentasi unduh Firebase Storage](https://firebase.google.com/docs/storage/web/download-files#cors_configuration).

1. Salin `storage.cors.example.json` menjadi `storage.cors.json`.
2. Ganti `https://YOUR-PROJECT.vercel.app` dengan URL website sebenarnya. Tambahkan domain kustom/preview jika dibutuhkan; sertakan protokol, tanpa garis miring di akhir.
3. Di Google Cloud Shell atau terminal dengan Google Cloud SDK, jalankan:

```sh
gsutil cors set storage.cors.json gs://NAMA_BUCKET
```

Gunakan bucket yang sama dengan `VITE_FIREBASE_STORAGE_BUCKET`. Jika memakai Cloud Shell, unggah juga file `storage.cors.json` ke Cloud Shell. Akses tetap memerlukan sesi Firebase meskipun origin tercantum dalam CORS.

## 6. Upload / deploy ke Vercel

1. Upload/push proyek ke repository GitHub/GitLab/Bitbucket milik Anda.
2. Di [Vercel](https://vercel.com/new), pilih **Add New → Project → Import** repository tersebut.
3. Gunakan **Root Directory** direktori yang berisi `package.json` dan `vercel.json`.
4. Pilih Node.js **24.x**, framework **Vite**, Build Command **`npm run build`**, Output Directory **`dist`**. Konfigurasi ini juga tersedia di `vercel.json`.
5. Tambahkan **enam** variabel `VITE_FIREBASE_*` dari tabel di atas ke Environment Variables (Production dan Preview jika digunakan). Biarkan `VITE_USE_FIREBASE_EMULATORS` kosong atau `false`.
6. Klik **Deploy**.
7. Masukkan domain hasil deploy ke **Firebase Authorized domains** dan konfigurasi CORS bucket.
8. Uji login Google, pendaftaran email, akses tamu, serta unggah teks/PDF/DOCX. Refresh langsung `/struktur`, `/login`, dan `/jurnal` juga harus bekerja.

Alternatif deploy dari terminal:

```powershell
npx.cmd vercel
# Atur environment variables pada dashboard proyek, lalu:
npx.cmd vercel --prod
```

Jika variabel Firebase diubah setelah deployment, lakukan **Redeploy** karena Vite membaca variabel pada waktu build. `vercel.json` menyediakan fallback route SPA sesuai [panduan Vite di Vercel](https://vercel.com/docs/frameworks/frontend/vite).

Untuk memeriksa hasil produksi secara lokal:

```powershell
npm.cmd run build
npm.cmd run preview
```

## 7. Pengujian tanpa proyek Firebase

```powershell
npm.cmd test
npm.cmd run test:rules
npm.cmd run test:e2e
```

- Unit test: pencarian serta validasi teks/berkas dan pesan kesalahan.
- Rules test: guest diizinkan, request tanpa login ditolak, pemalsuan pemilik/berkas tidak valid ditolak.
- Browser test: Google provider pop-up di emulator, daftar/login email, reset password, tamu, unggahan/unduhan teks/PDF/DOCX, refresh, filter, dan tampilan ponsel.

Pengujian integrasi memerlukan **Java 21+**, dan pengujian browser menggunakan **Google Chrome**. Emulator pertama kali diunduh otomatis. `.env.test` menggunakan proyek lokal `demo-justitia`, bukan kredensial produksi. Port emulator: 9099, 8080, 9199; browser test menggunakan port 3100. Jangan menjalankan dua rangkaian emulator secara bersamaan. Screenshot tersimpan di `artifacts/`.

Google OAuth produksi, authorized domains, CORS, dan billing bucket perlu diperiksa setelah proyek Firebase asli dibuat; emulator tidak memverifikasi pengaturan cloud tersebut.

## Struktur proyek

- `src/app.js`: halaman umum, router, direktori pengurus/anggota.
- `src/data.js`: identitas anggota contoh; ganti dengan data kelas asli.
- `src/portal.js`: UI login, repositori, form unggah, pratinjau, dan unduh.
- `src/firebase-client.js`: Firebase Auth, Firestore, Storage, dan emulator.
- `src/journal-model.js`: kategori, pencarian, validasi, dan pesan kesalahan.
- `public/`: CSS, font, foto ilustrasi, dan SVG lokal.
- `.env.example`: template konfigurasi Web App Firebase.
- `firestore.rules`, `storage.rules`: aturan akses server Firebase.
- `vercel.json`: konfigurasi build dan routing Vercel.

Foto anggota masih ilustrasi dan identitas masih contoh. Properti `photo` di `src/data.js` menunjuk nama berkas JPG dalam `public/assets/`; biarkan kosong untuk menampilkan inisial. Isi `linkedin` untuk menampilkan tautan profil asli. Font dan foto tersedia lokal sehingga tidak bergantung pada layanan gambar/font eksternal.
