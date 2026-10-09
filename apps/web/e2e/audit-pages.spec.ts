import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface PageAuditResult {
  url: string;
  title: string;
  httpStatus: number;
  consoleErrors: string[];
  failedRequests: string[];
  hasH1: boolean;
  h1Text: string;
  hasBreadcrumbs: boolean;
  usesDesignSystem: boolean;
  designSystemElements: number;
  formControlsCount: number;
  unlabelledInputs: number;
  linksCount: number;
  imagesCount: number;
  tableOrListCount: number;
  findings: string[];
  screenshotPath: string;
}

const auditResults: Record<string, PageAuditResult> = {};

test.describe('Auditoría Integral Playwright — 7 Páginas de VetBiobío', () => {
  let authToken = '';

  test.beforeAll(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@vetbiobio.local', password: 'changeme-admin-1234' }),
      });
      const cookieHeader = res.headers.get('set-cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/vetbiobio_admin=([^;]+)/);
        if (match) authToken = match[1];
      }
    } catch (e) {
      console.warn('No se pudo obtener cookie de auth:', e);
    }
  });

  const pagesToAudit = [
    { name: 'admin-precios', path: '/admin/precios?clinica=hospital-clinico-veterinario-uss', isAdmin: true },
    { name: 'admin-precios-sin-slug', path: '/admin/precios', isAdmin: true },
    { name: 'admin-horarios', path: '/admin/horarios?clinica=hospital-clinico-veterinario-uss', isAdmin: true },
    { name: 'admin-fotos', path: '/admin/fotos?clinica=hospital-clinico-veterinario-uss', isAdmin: true },
    { name: 'admin-verificar', path: '/admin/verificar', isAdmin: true },
    { name: 'catalogo-servicios', path: '/servicios', isAdmin: false },
    { name: 'catalogo-especialidades', path: '/especialidades', isAdmin: false },
    { name: 'catalogo-examenes', path: '/examenes', isAdmin: false },
  ];

  for (const item of pagesToAudit) {
    test(`Auditar ${item.name} (${item.path})`, async ({ context, page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      page.on('requestfailed', (req) => {
        failedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText})`);
      });

      if (item.isAdmin && authToken) {
        await context.addCookies([
          {
            name: 'vetbiobio_admin',
            value: authToken,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
          },
        ]);
      }

      const response = await page.goto(item.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const title = await page.title();
      const httpStatus = response?.status() ?? 0;

      // Análisis semántico y de jerarquía
      const h1Count = await page.locator('h1').count();
      const h1Text = h1Count > 0 ? (await page.locator('h1').first().innerText()).trim() : '';
      const hasBreadcrumbs = (await page.locator('nav[aria-label="Migas de pan"]').count()) > 0;

      // Verificación de adopción del Sistema de Diseño (Tailwind tokens semánticos)
      const dsLocator = page.locator('main [class*="bg-brand-"], main [class*="text-ink"], main [class*="bg-surface"], main [class*="border-border"], main [class*="rounded-"]');
      const designSystemElements = await dsLocator.count();
      const usesDesignSystem = designSystemElements >= 5;

      // Controles de formulario y accesibilidad de inputs
      const formControlsCount = await page.locator('main input, main select, main textarea, main button').count();
      const inputs = page.locator('main input, main select, main textarea');
      const inputCount = await inputs.count();
      let unlabelledInputs = 0;

      for (let i = 0; i < inputCount; i++) {
        const inp = inputs.nth(i);
        const id = await inp.getAttribute('id');
        const ariaLabel = await inp.getAttribute('aria-label');
        const ariaLabelledBy = await inp.getAttribute('aria-labelledby');
        let hasLabel = !!ariaLabel || !!ariaLabelledBy;
        if (!hasLabel && id) {
          hasLabel = (await page.locator(`label[for="${id}"]`).count()) > 0;
        }
        if (!hasLabel) {
          const hasParentLabel = (await inp.locator('xpath=ancestor::label').count()) > 0;
          if (!hasParentLabel) unlabelledInputs++;
        }
      }

      const linksCount = await page.locator('main a').count();
      const imagesCount = await page.locator('main img').count();
      const tableOrListCount = await page.locator('main table, main ul, main ol').count();

      // Directorio de salida y capturas de pantalla
      const outputDir = path.resolve(process.cwd(), 'e2e/output/audit');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const screenshotPath = path.join(outputDir, `${item.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const findings: string[] = [];

      if (!h1Text) {
        findings.push('CRÍTICO: No posee encabezado H1 semántico dentro del contenido principal.');
      }
      if (!usesDesignSystem) {
        findings.push('DISEÑO: Interfaz con HTML crudo sin estilizar; no implementa componentes ni tokens del Sistema de Diseño (Teal Bosque, Plus Jakarta Sans, Cards, Buttons).');
      }
      if (unlabelledInputs > 0) {
        findings.push(`ACCESIBILIDAD (WCAG 2.2): ${unlabelledInputs} controles de formulario no cuentan con etiqueta accesible explícita asociada (for/id o aria-label).`);
      }
      if (!hasBreadcrumbs) {
        findings.push('NAVEGACIÓN/SEO: Falta componente Breadcrumbs para jerarquía y orientación del usuario.');
      }
      if (item.name === 'admin-fotos' && imagesCount === 0) {
        findings.push('UX/MULTIMEDIA: La gestión de fotografías muestra sólo enlaces de texto sin miniaturas (previews visuales de las fotos subidas ni portadas destacadas).');
      }
      if (item.name === 'admin-precios-sin-slug' && formControlsCount === 0) {
        findings.push('UX/ESTADO VACÍO: Cuando falta el parámetro ?clinica=slug, muestra texto crudo "Falta ?clinica=slug" en lugar de un selector amigable de clínicas.');
      }
      if (item.name.startsWith('catalogo-') && linksCount <= 12) {
        findings.push('CATÁLOGO: Presentación básica en grid simple sin conteo de clínicas disponibles por ítem ni buscador/filtro en tiempo real.');
      }
      if (consoleErrors.length > 0) {
        findings.push(`ESTABILIDAD: Se detectaron ${consoleErrors.length} errores de consola JavaScript durante la sesión.`);
      }

      auditResults[item.name] = {
        url: item.path,
        title,
        httpStatus,
        consoleErrors,
        failedRequests,
        hasH1: h1Count > 0,
        h1Text,
        hasBreadcrumbs,
        usesDesignSystem,
        designSystemElements,
        formControlsCount,
        unlabelledInputs,
        linksCount,
        imagesCount,
        tableOrListCount,
        findings,
        screenshotPath,
      };

      expect(httpStatus).toBe(200);
    });
  }

  test.afterAll(async () => {
    const reportPath = path.resolve(process.cwd(), 'e2e/output/audit/audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf-8');
  });
});
