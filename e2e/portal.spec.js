import { test, expect } from '@playwright/test';
import { createJournalPdf } from './fixtures/pdf.js';
import { readFile } from 'node:fs/promises';

async function guest(page) {
  await page.goto('/jurnal');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Lanjutkan sebagai tamu' }).click();
  await expect(page).toHaveURL(/\/jurnal$/);
  await expect(page.getByText('Selamat datang, Tamu')).toBeVisible();
}
async function fillUpload(page, title) {
  await page.getByRole('button', { name: /Unggah Jurnal/ }).first().click();
  await page.getByLabel('Judul jurnal').fill(title);
  await page.getByLabel('Nama penulis').fill('Penulis Penguji');
  await page.getByLabel('Kategori', { exact: true }).selectOption('Hukum Perdata');
  await page.getByLabel('Ringkasan').fill('Ringkasan jurnal yang diterbitkan melalui pengujian integrasi Firebase.');
}

test('email registration, persistence, logout, invalid login and password reset', async ({ page }) => {
  const email = `anggota-${Date.now()}@example.test`;
  await page.goto('/login');
  await expect(page.getByText('Akun demonstrasi')).toHaveCount(0);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByText('Masukkan alamat email yang valid.')).toBeVisible();
  await page.getByRole('button', { name: 'Daftar sekarang' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('RahasiaKelas2026!');
  await page.getByRole('button', { name: 'Daftar akun', exact: true }).click();
  await expect(page).toHaveURL(/\/jurnal$/);
  await page.reload();
  await expect(page.getByRole('button', { name: /Unggah Jurnal/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Keluar' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('WrongPassword!');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Email atau password tidak sesuai.');
  await page.getByRole('button', { name: 'Lupa password?' }).click();
  await expect(page.locator('#notification')).toContainText('tautan reset password');
  await page.getByLabel('Password', { exact: true }).fill('RahasiaKelas2026!');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/jurnal$/);
});

test('guest publishes text, searches, previews safely and downloads after refresh', async ({ page }) => {
  const title = `Jurnal teks ${Date.now()}`;
  const content = 'Isi jurnal kelas. <img src=x onerror="window.injected=true"> Tetap tampil sebagai teks.';
  await guest(page);
  await fillUpload(page, title);
  await page.getByLabel('Isi jurnal', { exact: true }).fill(content);
  await page.getByRole('button', { name: 'Terbitkan jurnal' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await page.getByRole('searchbox').fill(title);
  await expect(page.locator('.journal-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Hukum Pidana', exact: true }).click();
  await expect(page.getByText('Jurnal belum ditemukan')).toBeVisible();
  await page.getByRole('button', { name: 'Hukum Perdata', exact: true }).click();
  await page.getByRole('button', { name: 'Pratinjau', exact: true }).click();
  await expect(page.locator('.journal-full-text')).toHaveText(content);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Unduh Teks' }).click();
  const download = await downloadPromise;
  expect(await readFile(await download.path(), 'utf8')).toBe(content);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/jurnal');
  await expect(page).toHaveURL(/\/login$/);
});

test('guest uploads and downloads original PDF and DOCX', async ({ page }) => {
  await guest(page);
  for (const kind of ['pdf', 'docx']) {
    const title = `Jurnal ${kind} ${Date.now()}`;
    const buffer = kind === 'pdf'
      ? Buffer.from(await createJournalPdf({ title, author: 'Penulis Penguji', category: 'Hukum Perdata', date: '27 September 2026', abstract: 'Naskah pengujian unggahan dokumen kelas.' }).arrayBuffer())
      : await readFile('e2e/fixtures/journal.docx');
    await fillUpload(page, title);
    await page.getByRole('radio', { name: kind.toUpperCase(), exact: true }).check();
    await page.locator('#journal-file').setInputFiles({ name: `journal.${kind}`, mimeType: kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer });
    await page.getByRole('button', { name: 'Terbitkan jurnal' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 });
    await page.getByRole('searchbox').fill(title);
    await expect(page.locator('.journal-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Pratinjau', exact: true }).click();
    if (kind === 'pdf') await expect(page.locator('#document-preview iframe')).toBeVisible();
    else await expect(page.getByRole('dialog')).toContainText('Microsoft Word');
    const promise = page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button', { name: `Unduh ${kind.toUpperCase()}` }).click();
    const download = await promise;
    expect(await readFile(await download.path())).toEqual(buffer);
    await page.keyboard.press('Escape');
  }
});

test('invalid PDF is rejected; text import can be published on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await guest(page);
  await fillUpload(page, 'Jurnal berkas tidak valid');
  await page.getByRole('radio', { name: 'PDF', exact: true }).check();
  await page.locator('#journal-file').setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Not a PDF') });
  await page.getByRole('button', { name: 'Terbitkan jurnal' }).click();
  await expect(page.locator('#upload-error')).toContainText('Berkas tidak valid');
  await page.getByRole('radio', { name: 'Tulis teks' }).check();
  await page.locator('#text-file').setInputFiles({ name: 'journal.txt', mimeType: 'text/plain', buffer: Buffer.from('Isi jurnal yang diimpor dari berkas teks untuk pengujian.') });
  await expect(page.getByLabel('Isi jurnal', { exact: true })).toHaveValue(/diimpor/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({ path: 'artifacts/upload-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Terbitkan jurnal' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('Google OAuth opens Firebase provider flow', async ({ page }) => {
  await page.goto('/login');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Lanjutkan dengan Google' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/127\.0\.0\.1:9099/);
  await expect(popup.locator('body')).toContainText('Google');
  await popup.close();
  await expect(page.locator('#login-error')).toContainText('dibatalkan', { timeout: 15000 });
});
