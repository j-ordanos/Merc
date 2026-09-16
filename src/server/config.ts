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
