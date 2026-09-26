// Seluruh identitas dan artikel berikut adalah data demonstrasi, bukan data institusi.
export const members = [
  { id: 1, name: 'Aditya Pratama', nim: '230101001', role: 'Ketua Kelas', division: 'Pengurus Inti', initials: 'AP', photo: 'aditya', linkedin: '', bio: 'Menghubungkan aspirasi teman-teman dan membangun lingkungan kelas yang terbuka, aktif, serta saling mendukung.' },
  { id: 2, name: 'Nadya Putri', nim: '230101002', role: 'Wakil Ketua Kelas', division: 'Pengurus Inti', initials: 'NP', photo: 'nadya', linkedin: '', bio: 'Mendampingi koordinasi kegiatan kelas dan memastikan setiap anggota mendapat ruang untuk berkontribusi.' },
  { id: 3, name: 'Alya Maharani', nim: '230101003', role: 'Sekretaris', division: 'Pengurus Inti', initials: 'AM', photo: 'alya', linkedin: '', bio: 'Mengelola administrasi, mendokumentasikan keputusan, serta menjaga informasi kelas tetap teratur dan mudah diakses.' },
  { id: 4, name: 'Rizky Ramadhan', nim: '230101004', role: 'Bendahara', division: 'Pengurus Inti', initials: 'RR', photo: 'rizky', linkedin: '', bio: 'Mengelola pencatatan keuangan kelas dengan mengutamakan transparansi dan pertanggungjawaban.' },
  { id: 5, name: 'Dimas Saputra', nim: '230101005', role: 'Koordinator Akademik', division: 'Akademik', initials: 'DS', photo: 'rizky', linkedin: '', bio: 'Memfasilitasi kelompok belajar, diskusi ilmiah, dan pengembangan karya tulis mahasiswa.' },
  { id: 6, name: 'Salsabila Zahra', nim: '230101006', role: 'Koordinator Hubungan Masyarakat', division: 'Humas', initials: 'SZ', photo: 'alya', linkedin: '', bio: 'Membangun komunikasi dan kolaborasi antara kelas, organisasi mahasiswa, dan komunitas kampus.' },
  { id: 7, name: 'Fajar Maulana', nim: '230101007', role: 'Koordinator Kreatif', division: 'Kreatif', initials: 'FM', photo: 'aditya', linkedin: '', bio: 'Merancang dokumentasi dan publikasi untuk merawat cerita serta identitas kelas.' },
  { id: 8, name: 'Kirana Anindya', nim: '230101008', role: 'Koordinator Sosial', division: 'Sosial', initials: 'KA', photo: 'nadya', linkedin: '', bio: 'Mengajak teman-teman berkontribusi melalui kegiatan kepedulian sosial dan pengabdian masyarakat.' },
  // Anggota kelas di luar pengurus. Ganti identitas contoh berikut dengan data kelas asli.
  ...[
    ['Bagas Wicaksono', 'BW'],
    ['Citra Amelia', 'CA'],
    ['Dewi Lestari', 'DL'],
    ['Eka Firmansyah', 'EF'],
    ['Intan Permatasari', 'IP'],
    ['Muhammad Farhan', 'MF'],
    ['Putri Azzahra', 'PA'],
    ['Yoga Saputra', 'YS']
  ].map(([name, initials], index) => ({
    id: index + 9,
    name,
    nim: `230101${String(index + 9).padStart(3, '0')}`,
    role: 'Anggota Kelas',
    division: 'Anggota Kelas',
    initials,
    photo: '',
    linkedin: '',
    bio: 'Bagian dari keluarga Justitia yang turut belajar, berbagi gagasan, dan berkontribusi dalam kegiatan kelas.'
  }))
];

export const journals = [
  { id: 1, title: 'Keadilan restoratif dalam perspektif pembaruan hukum pidana', category: 'Hukum Pidana', author: 'Aditya Pratama', date: '12 September 2026', pages: 1, abstract: 'Contoh naskah ini memperkenalkan gagasan pemulihan sebagai salah satu topik diskusi akademik hukum pidana. Pembahasan berfokus pada pertanyaan mengenai kepentingan korban, tanggung jawab pelaku, dan peran masyarakat. Materi ini disediakan untuk demonstrasi repositori dan bukan rujukan hukum atau hasil penelitian.' },
  { id: 2, title: 'Perlindungan data pribadi di era ekonomi digital', category: 'Hukum Perdata', author: 'Nadya Putri', date: '8 September 2026', pages: 1, abstract: 'Contoh naskah diskusi tentang hubungan antara aktivitas digital, persetujuan pengguna, dan tanggung jawab pengelolaan data. Artikel demonstrasi ini mengajak pembaca mengidentifikasi isu perlindungan privasi dalam kehidupan sehari-hari. Materi ini bukan hasil penelitian atau nasihat hukum.' },
  { id: 3, title: 'Konstitusi dan partisipasi warga dalam demokrasi', category: 'Hukum Tata Negara', author: 'Alya Maharani', date: '3 September 2026', pages: 1, abstract: 'Contoh bahan diskusi mengenai partisipasi warga dan gagasan konstitusionalisme. Naskah ini menyajikan pertanyaan awal untuk kegiatan belajar kelas mengenai hubungan masyarakat dengan lembaga negara. Seluruh isi merupakan materi demonstrasi, bukan penelitian atau rujukan hukum.' },
  { id: 4, title: 'Diplomasi dan penyelesaian sengketa lintas negara', category: 'Hukum Internasional', author: 'Dimas Saputra', date: '28 Agustus 2026', pages: 1, abstract: 'Naskah demonstrasi untuk memantik diskusi tentang dialog, kerja sama, dan penyelesaian sengketa dalam hubungan internasional. Pembaca diajak memetakan pertanyaan penelitian yang relevan. Materi ini tidak memuat kesimpulan penelitian atau nasihat hukum.' },
  { id: 5, title: 'Kesepakatan dan kepercayaan dalam kontrak digital', category: 'Hukum Perdata', author: 'Rizky Ramadhan', date: '21 Agustus 2026', pages: 1, abstract: 'Contoh naskah akademik mengenai pengalaman para pihak saat membuat kesepakatan secara digital. Pembahasan berupa pengantar diskusi kelas tentang kejelasan informasi dan harapan pengguna. Dokumen ini hanya untuk demonstrasi fitur repositori.' },
  { id: 6, title: 'Ruang publik dan literasi konstitusi generasi muda', category: 'Hukum Tata Negara', author: 'Salsabila Zahra', date: '16 Agustus 2026', pages: 1, abstract: 'Contoh naskah untuk diskusi kelas mengenai pendidikan kewargaan dan literasi konstitusi. Artikel mengusulkan topik percakapan yang dapat dikembangkan menjadi kegiatan belajar bersama. Dokumen demonstrasi ini bukan publikasi ilmiah atau nasihat hukum.' }
];

export function filterMembers(query = '', division = 'Semua') {
  const term = query.trim().toLocaleLowerCase('id');
  return members.filter(m => (division === 'Semua' || m.division === division) && `${m.name} ${m.nim} ${m.role}`.toLocaleLowerCase('id').includes(term));
}
export function filterJournals(query = '', category = 'Semua') {
  const term = query.trim().toLocaleLowerCase('id');
  return journals.filter(j => (category === 'Semua' || j.category === category) && `${j.title} ${j.author}`.toLocaleLowerCase('id').includes(term));
}
