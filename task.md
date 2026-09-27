 # 🏛️ Project Specification: Interactive Law Faculty Class Website

## 1. Project Overview
Project ini bertujuan untuk membangun website interaktif kelas **Fakultas Hukum** profesional yang menggabungkan estetika akademis klasik dengan fungsionalitas modern. Website ini berfungsi sebagai profil kelas, direktori struktur organisasi, dan repositori jurnal hukum terproteksi.

---

## 2. Design System & Aesthetics
Website harus mencerminkan wibawa, keadilan, dan tradisi hukum yang berakar dari era Romawi Kuno.

### Color Palette (Hex Codes)
*   **Primary (Dominan):** Maroon (`#800020`) — Melambangkan prestise, otoritas, dan akademik terhormat.
*   **Secondary:** Pure White (`#FFFFFF`) / Off-White (`#F9F9F9`) — Untuk latar belakang teks agar keterbacaan tinggi.
*   **Accent Dark:** Deep Black (`#111111`) — Untuk teks utama, navbar, dan komponen struktural berat.
*   **Accent Light (Optional):** Ancient Gold (`#D4AF37`) — *Hanya* untuk garis pembatas tipis, ikon dewi keadilan, atau efek hover tombol guna memperkuat kesan klasik.

### Typography
*   **Headings (H1, H2, H3):** Serif font seperti *Cinzel*, *Playfair Display*, atau *Garond* (Kesan formal, klasik, Romawi).
*   **Body Text:** Sans-serif modern seperti *Inter*, *Roboto*, atau *Lato* (Tipografi bersih, mudah dibaca, kontras tinggi).

### Visual & Ornaments Archetype
*   **Pilar Romawi (Ancient Roman Columns):** Integrasikan siluet pilar bergaya Corinthian atau Ionic sebagai pembatas seksi (*section divider*) atau latar belakang hero banner dengan opasitas rendah (subtle).
*   **Dewi Keadilan (Justitia / Lady Justice):** Tampilkan ilustrasi/ikon Dewi Keadilan memegang timbangan dan pedang pada area Hero Section, Favicon, dan Halaman Login.

---

## 3. Architecture & Page Structures

### 3.1. Landing Page (Beranda)
*   **Hero Section:** Judul kelas Fakultas Hukum, latar belakang atmosferik bertema hukum klasik, tombol CTA (*Call to Action*) menuju repositori jurnal.
*   **Visi & Misi:** Kutipan hukum terkenal dalam bahasa Latin (misal: *"Fiat justitia ruat caelum"*) dikombinasikan dengan narasi tujuan kelas.

### 3.2. Interactive Class Organization Chart (Struktur Organisasi)
*   **Bagan Dinamis:** Tampilan hierarki interaktif mulai dari Ketua Kelas, Wakil, Sekretaris, Bendahara, hingga Divisi-Divisi.
*   **Card Member Component:** Setiap anggota memiliki kartu profil digital yang berisi:
    *   Foto profil formal (dengan filter monokrom, berubah menjadi berwarna saat *hover*).
    *   Nama Lengkap & NIM.
    *   Jabatan/Divisi.
    *   Tautan media sosial/LinkedIn profesional.
*   **Interactive Filter:** Pengguna dapat memfilter anggota berdasarkan Divisi atau mencari nama anggota secara langsung menggunakan *search bar* berbasis *real-time filtering* (JavaScript/React/Vue).

### 3.3. Authentication Gate (Sistem Login Jurnal)
*   **Interfase:** Halaman login minimalis-premium dengan latar belakang gelap/maroon aman. Menampilkan kutipan hukum dan logo timbangan keadilan.
*   **Validasi:** Form input Username/Email dan Password dengan validasi sisi klien (*client-side validation*) yang ketat dan aman.

### 3.4. Protected Journal Dashboard (Repositori Jurnal)
*   *Halaman ini hanya dapat diakses setelah user berhasil login (Protected Route).*
*   **Fungsionalitas Dasbor:**
    *   Menampilkan daftar jurnal hukum yang ditulis oleh mahasiswa/dosen kelas.
    *   Fitur unduh (Download PDF) dan pratinjau (*Preview*).
    *   **Filter Kategori Jurnal:** Hukum Pidana, Hukum Perdata, Hukum Tata Negara, Hukum Internasional, dll.
    *   Fitur pencarian jurnal berdasarkan kata kunci judul atau nama penulis.

---

## 4. Technical Stack Recommendations
*   **Frontend:** HTML5, CSS3 (atau TailwindCSS untuk efisiensi utilitas warna maroon/hitam), Vanilla JavaScript (atau React.js / Next.js untuk skalabilitas).
*   **State Management/Auth:** Sesi lokal di server Node.js untuk proteksi halaman jurnal. Data akun disimpan di file JSON lokal.
*   **Animations:** Framer Motion atau AOS (Animate on Scroll) untuk transisi halus pada ornamen Romawi dan bagan organisasi.

---

## 5. Development Tasks & Prompt For Codex Execution
1.  **Task 1:** Buat sistem tata letak dasar global (layout) menggunakan skema warna Maroon, Hitam, dan Putih dengan aturan tipografi serif untuk heading.
2.  **Task 2:** Desain navbar dan footer yang menyertakan SVG ornamen pilar Romawi dan ikon Dewi Keadilan yang responsif.
3.  **Task 3:** Implementasikan komponen struktur organisasi interaktif yang bisa diklik untuk memunculkan modal/pop-up detail profil anggota.
4.  **Task 4:** Bangun sistem otentikasi login (mockup frontend dan logic token session). Jika token tidak ada, arahkan otomatis kembali ke `/login`.
5.  **Task 5:** Desain halaman galeri jurnal hukum dengan sistem pencarian dinamis yang memfilter data berdasarkan input teks dan kategori hukum.
