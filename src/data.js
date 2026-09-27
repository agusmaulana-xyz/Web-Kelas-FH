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
    bio: 'Bagian dari keluarga Justice After Dark yang turut belajar, berbagi gagasan, dan berkontribusi dalam kegiatan kelas.'
  }))
];

export function filterMembers(query = '', division = 'Semua') {
  const term = query.trim().toLocaleLowerCase('id');
  return members.filter(m => (division === 'Semua' || m.division === division) && `${m.name} ${m.nim} ${m.role}`.toLocaleLowerCase('id').includes(term));
}
