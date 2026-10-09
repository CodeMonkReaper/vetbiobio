import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: jest.fn().mockImplementation((query: string) => {
        if (query.includes('PostGIS_Version')) {
          return Promise.resolve([{ version: '3.4.2 USE_GEOS=1 USE_PROJ=1' }]);
        }
        return Promise.resolve([{ '?column?': 1 }]);
      }),
    };

    controller = new HealthController(mockPrisma);
  });

  it('retorna estado ok con latencia de PostgreSQL, versión de PostGIS y uso de memoria', async () => {
    const res = await controller.check();

    expect(res.status).toBe('ok');
    expect(res.database.status).toBe('connected');
    expect(typeof res.database.latencyMs).toBe('number');
    expect(res.postgis.status).toBe('ready');
    expect(res.postgis.version).toContain('3.4.2');
    expect(res.memory.rssMb).toBeGreaterThan(0);
  });
});
