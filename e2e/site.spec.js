import { test, expect } from '@playwright/test';

async function loadImages(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); }));
  });
}

test('desktop navigation, member filters, profile modal and empty state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Berakar pada nilai.');
  await loadImages(page);
  await page.screenshot({ path: 'artifacts/beranda-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Lihat struktur lengkap' }).click();
  await expect(page.locator('.member-card')).toHaveCount(16);
  await page.getByRole('searchbox').fill('Nadya');
  await expect(page.locator('.member-card')).toHaveCount(1);
  await page.locator('.member-card').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nadya Putri', exact: true, level: 2 })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('#division').selectOption('Humas');
  await expect(page.getByText('Anggota belum ditemukan')).toBeVisible();
  await page.getByRole('button', { name: 'Reset pencarian' }).click();
  await expect(page.locator('.member-card')).toHaveCount(16);
  await page.reload();
  await expect(page.locator('.member-card')).toHaveCount(16);
  await expect(page.getByRole('heading', { name: 'ANGGOTA KELAS', exact: true })).toBeVisible();
  await expect(page.locator('.division-grid .member-card')).toHaveCount(4);
  await expect(page.locator('.class-member-grid .member-card')).toHaveCount(8);
  await page.locator('#division').selectOption('Anggota Kelas');
  await expect(page.locator('.member-card')).toHaveCount(8);
  await page.getByRole('searchbox').fill('230101009');
  await expect(page.locator('.member-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Lihat profil Bagas Wicaksono' }).click();
  await expect(page.getByRole('dialog')).toContainText('Bagas Wicaksono');
  await expect(page.getByRole('dialog')).toContainText('Anggota Kelas');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('login gate, validation, journal filtering, preview, PDF download and logout', async ({ page }) => {
  await page.goto('/jurnal');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Masuk ke Repositori' }).click();
  await expect(page.getByText('Masukkan username atau email.', { exact: true })).toBeVisible();
  await page.locator('#username').fill('wrong@');
  await page.locator('#password').fill('incorrect-password');
  await page.getByRole('button', { name: 'Masuk ke Repositori' }).click();
  await expect(page.getByText('Format email belum valid.')).toBeVisible();
  await page.locator('#username').fill('wrong');
  await page.getByRole('button', { name: 'Masuk ke Repositori' }).click();
  await expect(page.getByRole('alert')).toContainText('Username atau password belum sesuai');
  await page.getByRole('button', { name: 'Gunakan akun demo' }).click();
  await page.getByRole('button', { name: 'Tampilkan password' }).click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Masuk ke Repositori' }).click();
  await expect(page).toHaveURL(/\/jurnal$/);
  await expect(page.locator('.journal-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Hukum Perdata', exact: true }).click();
  await expect(page.locator('.journal-card')).toHaveCount(2);
  await page.getByRole('searchbox').fill('Nadya');
  await expect(page.locator('.journal-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pratinjau', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Perlindungan data pribadi');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Unduh PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('justitia-jurnal-2.pdf');
  await download.saveAs('artifacts/jurnal-contoh.pdf');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page).toHaveURL(/\/jurnal$/);
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/jurnal');
  await expect(page).toHaveURL(/\/login$/);
});

test('expired sessions cannot access repository', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('justitia-session', JSON.stringify({ token: 'expired-demo', expires: Date.now() - 1000 })));
  await page.goto('/jurnal');
  await expect(page).toHaveURL(/\/login$/);
});

test('mobile navigation and pages fit viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/tentang', '/struktur', '/login']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflows, `${route} overflows mobile viewport`).toBe(false);
  }
  await page.goto('/');
  await loadImages(page);
  await page.screenshot({ path: 'artifacts/beranda-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Buka menu navigasi' }).click();
  await page.locator('#main-nav').getByRole('link', { name: 'Struktur Organisasi' }).click();
  await expect(page).toHaveURL(/\/struktur$/);
  await expect(page.locator('.member-card')).toHaveCount(16);
});
