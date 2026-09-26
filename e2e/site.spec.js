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
