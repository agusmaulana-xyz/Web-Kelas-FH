// A small, dependency-free PDF writer for the one-page demonstration articles.
export function createJournalPdf(journal) {
  const clean = text => String(text).normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/[\\()]/g, '\\$&');
  const wrap = (text, width) => {
    const lines = []; let line = '';
    for (const word of text.split(/\s+/)) {
      if (`${line} ${word}`.trim().length > width && line) { lines.push(line); line = word; }
      else line = `${line} ${word}`.trim();
    }
    if (line) lines.push(line);
    return lines;
  };
  let stream = '0.50 0 0.13 rg\n50 780 495 3 re f\n';
  let y = 752;
  const write = (text, size = 12, font = 'F1', gap = 20) => { stream += `BT /${font} ${size} Tf 0.12 0.12 0.12 rg 50 ${y} Td (${clean(text)}) Tj ET\n`; y -= gap; };
  write('JUSTITIA / FAKULTAS HUKUM', 12, 'F2', 37);
  write(`${journal.category.toUpperCase()} | NASKAH DEMONSTRASI`, 10, 'F1', 30);
  for (const line of wrap(journal.title, 48)) write(line, 20, 'F2', 26);
  y -= 12;
  write(`${journal.author} | ${journal.date}`, 11, 'F1', 42);
  write('ABSTRAK', 12, 'F2', 26);
  for (const line of wrap(journal.abstract, 77)) write(line, 11, 'F1', 19);
  y -= 30;
  write('BAHAN DISKUSI', 12, 'F2', 26);
  for (const line of wrap('Pertanyaan untuk diskusi kelas: isu apa yang perlu dikaji lebih lanjut, sumber primer apa yang dibutuhkan, dan bagaimana menyusun pertanyaan penelitian yang dapat dipertanggungjawabkan?', 77)) write(line, 11, 'F1', 19);
  y = 95;
  write('Dokumen contoh untuk demonstrasi website. Bukan publikasi ilmiah atau nasihat hukum.', 9, 'F1', 20);
  write('Justitia - Ruang gagasan dan kajian hukum                                      Halaman 1 / 1', 9);
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>', `<< /Length ${stream.length} >>\nstream\n${stream}endstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
}
