import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMembers, filterJournals, journals } from '../public/data.js';
import { createJournalPdf } from '../public/pdf.js';

test('member search combines normalized query and division', () => {
  assert.equal(filterMembers('  NADYA ', 'Pengurus Inti')[0].name, 'Nadya Putri');
  assert.equal(filterMembers('230101005', 'Akademik')[0].name, 'Dimas Saputra');
  assert.equal(filterMembers('nadya', 'Humas').length, 0);
  assert.equal(filterMembers('no matching member').length, 0);
});

test('journal search supports title, author and category together', () => {
  assert.equal(filterJournals(' DATA ', 'Hukum Perdata')[0].id, 2);
  assert.equal(filterJournals('aditya', 'Hukum Pidana')[0].id, 1);
  assert.equal(filterJournals('aditya', 'Hukum Perdata').length, 0);
  assert.equal(filterJournals('', 'Hukum Tata Negara').length, 2);
});

test('all downloadable PDFs contain real content and correct cross-reference offsets', async () => {
  for (const journal of journals) {
    const blob = createJournalPdf(journal);
    assert.equal(blob.type, 'application/pdf');
    const pdf = await blob.text();
    assert.ok(pdf.startsWith('%PDF-1.4'));
    assert.ok(pdf.endsWith('%%EOF\n'));
    assert.ok(pdf.includes(journal.author));
    const xref = Number(pdf.match(/startxref\n(\d+)/)[1]);
    assert.equal(pdf.slice(xref, xref + 4), 'xref');
    const offsets = [...pdf.matchAll(/(\d{10}) 00000 n/g)].map(m => Number(m[1]));
    offsets.forEach((offset, i) => assert.ok(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)));
    const stream = pdf.match(/\/Length (\d+) >>\nstream\n([\s\S]*?)endstream/);
    assert.equal(Number(stream[1]), new TextEncoder().encode(stream[2]).length);
  }
});
