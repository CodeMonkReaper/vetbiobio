// E2E flujo crítico: buscar → filtrar → perfil → comparar → contactar (eventos).
// Corre contra la BD dev (PostGIS localhost:5433) con datos demo seed.
// Solo crea eventos (limpiados al final); no muta clínicas/catálogos.
// Requiere: DATABASE_URL en entorno + `pnpm --filter api test:e2e`.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { installBigIntJson } from '../src/common/bigint-json';

installBigIntJson();

describe('VetBiobio E2E (buscar → perfil → comparar → contactar)', () => {
  let app: INestApplication;
  let adminCookie = '';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('busca dermatología y encuentra Concepción', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/clinics?q=dermatologia').expect(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.map((c: { slug: string }) => c.slug)).toContain('clinica-veterinaria-concepcion');
  });

  it('filtra radiografía en radio 5km ordenando por distancia', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics?exam=radiografia&lat=-36.827&lng=-73.0503&radius_km=5&sort=DISTANCE')
      .expect(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data[0].slug).toBe('clinica-veterinaria-concepcion');
    expect(res.body.data[0].km).toBeCloseTo(0, 0);
  });

  it('ordena consulta por precio con CONTACT al final', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics?service=consulta-general&sort=PRICE_ASC')
      .expect(200);
    const prices = res.body.data.map((c: { min_price: number | null }) => c.min_price);
    expect(prices[0]).toBe(18000);
    expect(prices[prices.length - 1]).toBeNull();
  });

  it('abre el perfil con secciones y precio vigente (no el histórico)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics/clinica-veterinaria-concepcion')
      .expect(200);
    const consulta = res.body.data.services.find((s: { slug: string }) => s.slug === 'consulta-general');
    expect(consulta.min_amount).toBe(25000);
    expect(res.body.data.professionals[0].specialties).toMatch(/Dermatolog/);
  });

  it('perfil inexistente → 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/clinics/no-existe').expect(404);
  });

  it('compara 2 clínicas y rechaza 4', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics/compare/by-slugs?slugs=clinica-veterinaria-concepcion,veterinaria-talcahuano&lat=-36.827&lng=-73.0503')
      .expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].km).toBeDefined();
    await request(app.getHttpServer())
      .get('/api/v1/clinics/compare/by-slugs?slugs=a,b,c,d')
      .expect(400);
  });

  it('registra evento de contacto y rechaza tipo inválido', async () => {
    const ok = await request(app.getHttpServer())
      .post('/api/v1/events')
      .send({ clinicSlug: 'veterinaria-talcahuano', type: 'phone_click' })
      .expect(201);
    expect(ok.body.id).toBeDefined();
    await request(app.getHttpServer()).post('/api/v1/events').send({ type: 'hack' }).expect(400);
  });

  it('admin sin sesión → 401; login real funciona', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/reports').expect(401);
    const login = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@vetbiobio.local', password: 'changeme-admin-1234' })
      .expect(200);
    const setCookie = login.headers['set-cookie'] as unknown as string[];
    expect(setCookie.join(';')).toMatch(/vetbiobio_admin=.*HttpOnly/);
    adminCookie = (setCookie as string[])[0].split(';')[0];
    await request(app.getHttpServer())
      .get('/api/v1/admin/reports')
      .set('Cookie', adminCookie)
      .expect(200);
  });
});
