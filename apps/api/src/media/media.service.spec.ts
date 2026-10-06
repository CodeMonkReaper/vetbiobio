import { MediaService } from './media.service';

describe('media (sin credenciales)', () => {
  it('signUpload responde 503 sin CLOUDINARY_*', () => {
    const saved = { ...process.env };
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    const svc = new MediaService(null as never, null as never);
    expect(() => svc.signUpload()).toThrow(/no configuradas/);
    process.env = saved;
  });
});
