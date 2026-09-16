import { afterEach, describe, expect, it, vi } from 'vitest';
import { appUrl, paymentPublicUrl } from '@/server/config';
import { fail } from '@/server/errors';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('local app and public payment URLs', () => {
  it('allows local HTTP app requests with a separate HTTPS payment callback', () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    vi.stubEnv('STARPAY_PUBLIC_URL', 'https://merc-lac.vercel.app/');
    expect(appUrl()).toBe('http://localhost:3000');
    expect(paymentPublicUrl()).toBe('https://merc-lac.vercel.app');
  });
  it('defaults to the public app URL in production', () => {
    vi.stubEnv('APP_URL', 'https://merc-lac.vercel.app');
    vi.stubEnv('STARPAY_PUBLIC_URL', '');
    expect(paymentPublicUrl()).toBe('https://merc-lac.vercel.app');
  });
  it('rejects local-only callbacks and malformed configuration', () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    vi.stubEnv('STARPAY_PUBLIC_URL', '');
    expect(paymentPublicUrl).toThrow('STARPAY_PUBLIC_URL');
    vi.stubEnv('STARPAY_PUBLIC_URL', 'not-a-url');
    expect(paymentPublicUrl).toThrow('needs configuration');
  });
});

describe('safe setup diagnostics', () => {
  it.each(['PGRST205', 'PGRST202'])(
    'explains missing schema (%s) without leaking the raw database response',
    async (code) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      const response = fail({ code, message: 'private upstream detail', details: 'private data' });
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error.code).toBe('DATABASE_NOT_READY');
      expect(JSON.stringify(body)).not.toContain('private');
      expect(JSON.stringify(log.mock.calls)).not.toContain('private');
    },
  );
  it('reports database access failures distinctly', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await fail({ code: '42501' }).json()).error.code).toBe('DATABASE_ACCESS');
  });
});
