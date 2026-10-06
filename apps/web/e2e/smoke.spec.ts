import { expect, test } from '@playwright/test';

// Smoke visual del flujo crítico. Requiere API+web levantadas + datos piloto.
test('home con hero y buscador', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Encuentra una veterinaria/ })).toBeVisible();
  await page.screenshot({ path: './e2e/output/home.png' });
});

test('listado Talcahuano con 5 cards', async ({ page }) => {
  await page.goto('/veterinarias?commune=talcahuano');
  await expect(page.getByRole('heading', { name: /Veterinarias \(5\)/ })).toBeVisible();
  await expect(page.getByText('JaviVets')).toBeVisible();
  await page.screenshot({ path: './e2e/output/listado.png' });
});

test('perfil con mapa (canvas Mapbox o iframe OSM)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/veterinarias/concepcion/clinica-veterinaria-concepcion');
  await expect(page.getByRole('heading', { name: 'Clínica Veterinaria Concepción' })).toBeVisible();
  const figure = page.locator('figure').filter({ hasText: 'Ver mapa ampliado' });
  await expect(figure).toBeVisible();
  // Espera a que pinte algo: canvas WebGL o iframe OSM.
  await expect(figure.locator('canvas, iframe')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(3000);
  await figure.screenshot({ path: './e2e/output/mapa.png' });
  await page.screenshot({ path: './e2e/output/perfil.png', fullPage: false });
  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
});
