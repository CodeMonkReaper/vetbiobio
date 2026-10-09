import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('genera un UUID nuevo si x-request-id no viene en la solicitud', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.headers['x-request-id']);
    expect(next).toHaveBeenCalled();
  });

  it('preserva el x-request-id si ya viene provisto por el cliente/gateway', () => {
    const existingId = 'client-req-uuid-1234';
    const req: any = { headers: { 'x-request-id': existingId } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', existingId);
    expect(next).toHaveBeenCalled();
  });
});
