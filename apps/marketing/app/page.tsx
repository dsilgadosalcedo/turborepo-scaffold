import Link from "next/link";
import styles from "./page.module.css";

const productUrl = process.env.NEXT_PUBLIC_PRODUCT_WEB_URL ?? "https://app.example.com";

const pillars = [
  {
    eyebrow: "One product surface",
    title: "Build the app once for browser and desktop.",
    body: "Keep the product in apps/web, let Electron stay a thin shell, and avoid duplicating features across platforms.",
  },
  {
    eyebrow: "Public site separation",
    title: "Ship marketing without bloating the desktop bundle.",
    body: "Overview pages, pricing, changelogs, and downloads live in apps/marketing, completely separate from the packaged desktop runtime.",
  },
  {
    eyebrow: "Release discipline",
    title: "Publish installers the way users expect.",
    body: "Offer DMG and Windows installers for first-time downloads, while ZIP artifacts continue supporting background update flows.",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.mesh} />

      <section className={styles.hero}>
        <p className={styles.kicker}>Scaffold architecture</p>
        <h1 className={styles.title}>
          A real marketing app, a real product app, and a desktop shell.
        </h1>
        <p className={styles.lead}>
          This scaffold keeps public pages separate from the packaged desktop experience, so your
          product app stays focused and your release surface stays professional.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/download">
            Download desktop
          </Link>
          <a className={styles.secondaryAction} href={productUrl} rel="noreferrer">
            Open product app
          </a>
        </div>
      </section>

      <section className={styles.pillars}>
        {pillars.map((pillar) => (
          <article className={styles.card} key={pillar.title}>
            <p className={styles.cardEyebrow}>{pillar.eyebrow}</p>
            <h2 className={styles.cardTitle}>{pillar.title}</h2>
            <p className={styles.cardBody}>{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className={styles.split}>
        <div className={styles.callout}>
          <p className={styles.calloutEyebrow}>Recommended monorepo shape</p>
          <h2>Keep responsibilities crisp from day one.</h2>
          <p>
            Use <code>apps/web</code> for the product, <code>apps/desktop</code> for Electron, and
            <code>apps/marketing</code> for download, pricing, overview, docs, and onboarding pages.
          </p>
        </div>
        <div className={styles.stack}>
          <div className={styles.stackPanel}>
            <span>apps/web</span>
            <strong>Product app</strong>
            <p>Shared by browser users and the desktop shell.</p>
          </div>
          <div className={styles.stackPanel}>
            <span>apps/desktop</span>
            <strong>Desktop runtime</strong>
            <p>Packages the standalone web app and manages native updates.</p>
          </div>
          <div className={styles.stackPanel}>
            <span>apps/marketing</span>
            <strong>Public site</strong>
            <p>Owns downloads, messaging, pricing, guides, and changelog pages.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
