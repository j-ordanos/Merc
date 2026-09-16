import 'server-only';
import { AppError } from './errors';
export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value)
    throw new AppError(
      503,
      'SERVICE_NOT_CONFIGURED',
      'This service is being set up. Please try again later.',
    );
  return value;
}
export function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function demoCatalog() {
  return (
    process.env.DEMO_CATALOG === 'true' ||
    (!hasSupabase() && process.env.NODE_ENV === 'development')
  );
}
export function appUrl() {
  return requiredEnv('APP_URL').replace(/\/$/, '');
}
// Local app/auth requests may use HTTP. Payment callbacks need a reachable HTTPS deployment.
export function paymentPublicUrl() {
  const value = process.env.STARPAY_PUBLIC_URL?.trim() || appUrl();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AppError(
      503,
      'INVALID_PAYMENT_URL',
      'The store’s payment connection needs configuration.',
    );
  }
  if (url.protocol !== 'https:')
    throw new AppError(
      503,
      'PUBLIC_URL_REQUIRED',
      'Payment setup requires a public HTTPS callback address. Set STARPAY_PUBLIC_URL to your deployed store URL.',
    );
  return url.origin;
}
