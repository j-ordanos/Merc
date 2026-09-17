'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function NavigationEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    )
      return;
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08, rootMargin: '0px 0px 35px 0px' },
    );
    elements.forEach((element) => {
      element.classList.add('reveal-pending');
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
