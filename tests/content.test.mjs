import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMembers } from '../src/data.js';
import { filterJournalList, validateJournal, validateFile, MAX_FILE_SIZE, friendlyError } from '../src/journal-model.js';

test('member filtering includes members as well as coordinators', () => {
  assert.equal(filterMembers('  NADYA ', 'Pengurus Inti')[0].name, 'Nadya Putri');
  assert.equal(filterMembers('230101009', 'Anggota Kelas')[0].name, 'Bagas Wicaksono');
  assert.equal(filterMembers('nadya', 'Humas').length, 0);
});
test('journal search combines title/author with category', () => {
  const data = [{ title: 'Perlindungan data', author: 'Nadya', category: 'Hukum Perdata' }, { title: 'Konstitusi', author: 'Alya', category: 'Hukum Tata Negara' }];
  assert.equal(filterJournalList(data, ' DATA ', 'Hukum Perdata').length, 1);
  assert.equal(filterJournalList(data, 'nadya', 'Hukum Perdata').length, 1);
  assert.equal(filterJournalList(data, 'nadya', 'Hukum Pidana').length, 0);
});
test('journal validation rejects missing fields, invalid categories and oversized text', () => {
  const valid = { title: 'Jurnal kelas hukum', author: 'Penulis', category: 'Hukum Perdata', abstract: 'Ringkasan karya yang cukup panjang.', kind: 'text', content: 'Isi karya tulis yang cukup panjang.' };
  assert.doesNotThrow(() => validateJournal(valid));
  assert.throws(() => validateJournal({ ...valid, title: '' }), /Judul/);
  assert.throws(() => validateJournal({ ...valid, category: 'invalid' }), /kategori/);
  assert.throws(() => validateJournal({ ...valid, content: '漢'.repeat(40000) }), /100 KB/);
});
test('file validation checks format, signature, empty and oversized uploads', async () => {
  await assert.doesNotReject(() => validateFile(new File(['%PDF-1.4\n'], 'journal.pdf', { type: 'application/pdf' }), 'pdf'));
  await assert.rejects(() => validateFile(new File(['fake'], 'journal.pdf', { type: 'application/pdf' }), 'pdf'), /tidak valid/);
  await assert.rejects(() => validateFile(new File(['%PDF-'], 'journal.exe'), 'pdf'), /Format/);
  await assert.rejects(() => validateFile(new File([], 'journal.pdf'), 'pdf'), /kosong/);
  await assert.rejects(() => validateFile(new File([new Uint8Array(MAX_FILE_SIZE + 1)], 'journal.pdf'), 'pdf'), /10 MB/);
  await assert.doesNotReject(() => validateFile(new File([new Uint8Array([80, 75, 3, 4, 0])], 'journal.docx'), 'docx'));
});
test('errors show actionable messages rather than Firebase internals', () => {
  assert.match(friendlyError({ code: 'auth/invalid-credential' }), /Email atau password/);
  assert.match(friendlyError({ code: 'storage/unauthorized' }), /tidak dapat diakses/);
  assert.ok(!friendlyError({ code: 'unknown/internal', message: 'secret internals' }).includes('secret'));
});
