'use client';
import { Notice } from '@/components/ui';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container page-section">
      <h1>Page unavailable</h1>
      <Notice error>We couldn’t load this page. Please try again in a moment.</Notice>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
