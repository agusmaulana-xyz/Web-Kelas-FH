export const categories = ['Hukum Pidana', 'Hukum Perdata', 'Hukum Tata Negara', 'Hukum Internasional', 'Hukum Administrasi', 'Hukum Lingkungan', 'Lainnya'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TEXT_BYTES = 100000;
export const MIME_TYPES = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

export function filterJournalList(journals, query = '', category = 'Semua') {
  const term = query.trim().toLocaleLowerCase('id');
  return journals.filter(j => (category === 'Semua' || j.category === category) && `${j.title} ${j.author}`.toLocaleLowerCase('id').includes(term));
}
export function validateJournal(input) {
  if (input.title.trim().length < 5 || input.title.trim().length > 180) throw new Error('Judul harus terdiri dari 5–180 karakter.');
  if (input.author.trim().length < 2 || input.author.trim().length > 100) throw new Error('Nama penulis harus terdiri dari 2–100 karakter.');
  if (!categories.includes(input.category)) throw new Error('Pilih kategori jurnal.');
  if (input.abstract.trim().length < 20 || input.abstract.trim().length > 2000) throw new Error('Ringkasan harus terdiri dari 20–2.000 karakter.');
  if (!['text', 'pdf', 'docx'].includes(input.kind)) throw new Error('Format jurnal tidak didukung.');
  if (input.kind === 'text' && (input.content.trim().length < 20 || new TextEncoder().encode(input.content.trim()).length > MAX_TEXT_BYTES)) throw new Error('Isi jurnal minimal 20 karakter dan maksimal 100 KB.');
}
export async function validateFile(file, kind) {
  if (!file || file.size <= 0) throw new Error('Pilih berkas yang tidak kosong.');
  if (file.size > MAX_FILE_SIZE) throw new Error('Ukuran berkas maksimal 10 MB.');
  if (file.name.length > 180) throw new Error('Nama berkas maksimal 180 karakter.');
  if (!file.name.toLowerCase().endsWith(`.${kind}`) || !MIME_TYPES[kind]) throw new Error('Format berkas harus sesuai pilihan PDF atau DOCX.');
  if (file.type && file.type !== MIME_TYPES[kind] && file.type !== 'application/octet-stream' && !(kind === 'docx' && file.type === 'application/zip')) throw new Error('Tipe berkas tidak sesuai format yang dipilih.');
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const valid = kind === 'pdf' ? new TextDecoder().decode(bytes) === '%PDF-' : bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!valid) throw new Error('Berkas tidak valid. Pilih dokumen PDF atau DOCX asli.');
}
export function friendlyError(error) {
  return error?.code
    ? 'Proses belum berhasil. Coba lagi atau hubungi pengelola.'
    : error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
}
