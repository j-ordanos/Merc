import type { ReactNode } from 'react';

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="container page-section info-page">
      <header className="info-intro">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      {children}
    </div>
  );
}

export function InfoSection({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="info-section" id={id}>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
