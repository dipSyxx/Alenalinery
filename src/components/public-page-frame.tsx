import type { ReactNode } from "react";

type PublicPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicPageFrame({ eyebrow, title, description, children }: PublicPageFrameProps) {
  return (
    <main className="public-page">
      <section className="public-page__hero">
        <div className="landing-container">
          <p className="landing-overline">{eyebrow}</p>
          <h1 className="landing-display mt-4">{title}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-studio-surface/70 sm:text-base">{description}</p>
        </div>
      </section>
      <section className="public-page__surface">{children}</section>
    </main>
  );
}
