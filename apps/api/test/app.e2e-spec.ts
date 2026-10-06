// E2E flujo crítico: buscar → filtrar → perfil → comparar → contactar (eventos).
// Corre contra la BD dev (PostGIS localhost:5433) con datos del PILOTO real
// (16 clínicas Gran Concepción: 8 Concepción, 5 Talcahuano, 3 San Pedro;
// 1 VERIFIED, 15 PENDING_REVIEW). Solo crea eventos (limpiados al final).
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

  it('busca por comuna: Talcahuano tiene 5', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/clinics?commune=talcahuano').expect(200);
    expect(res.body.meta.total).toBe(5);
  });

  it('filtra por texto + radio: encuentra SOS cerca del centro', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics?q=sos&lat=-36.82&lng=-73.04&radius_km=5')
      .expect(200);
    expect(res.body.data.map((c: { slug: string }) => c.slug)).toContain('clinica-veterinaria-sos');
  });

  it('verified_only devuelve solo la verificada', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/clinics?verified_only=true').expect(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].slug).toBe('clinica-veterinaria-concepcion');
  });

  it('abre el perfil real con contacto y ubicación', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics/veterinaria-mascotas-talcahuano')
      .expect(200);
    expect(res.body.data.phone).toBe('+56975768139');
    expect(res.body.data.commune_slug).toBe('talcahuano');
    expect(res.body.data.latitude).toBeCloseTo(-36.7225, 3);
  });

  it('perfil inexistente → 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/clinics/no-existe').expect(404);
  });

  it('compara 2 clínicas reales y rechaza 4', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/clinics/compare/by-slugs?slugs=clinica-kennel,condorvet&lat=-36.72&lng=-73.1')
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
