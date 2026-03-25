import type { Metadata } from "next";
import styles from "./page.module.css";

const downloadOptions = [
  {
    description: "Recommended for Apple Silicon Macs.",
    format: ".zip today, .dmg next",
    platform: "macOS",
    title: "Apple Silicon (arm64)",
  },
  {
    description: "For Intel-based Macs.",
    format: ".zip today, .dmg next",
    platform: "macOS",
    title: "Intel (x64)",
  },
  {
    description: "Installer with auto-update support.",
    format: ".exe",
    platform: "Windows",
    title: "Windows 10, 11",
  },
];

export const metadata: Metadata = {
  title: "Download desktop",
  description: "Download the desktop app for macOS and Windows.",
};

export default function DownloadPage() {
  return (
    <main className={styles.page}>
      <div className={styles.glowA} />
      <div className={styles.glowB} />

      <section className={styles.hero}>
        <p className={styles.kicker}>Desktop release</p>
        <h1 className={styles.title}>Download the desktop app</h1>
        <p className={styles.lead}>
          One shared product experience across browser and desktop. Install locally, then keep the
          app up to date with background releases.
        </p>
      </section>

      <section className={styles.grid}>
        {downloadOptions.map((option) => (
          <article className={styles.card} key={`${option.platform}-${option.title}`}>
            <div className={styles.cardHeader}>
              <span className={styles.platform}>{option.platform}</span>
              <span className={styles.format}>{option.format}</span>
            </div>
            <h2 className={styles.cardTitle}>{option.title}</h2>
            <p className={styles.cardBody}>{option.description}</p>
            <button className={styles.button} type="button">
              Coming soon
            </button>
          </article>
        ))}
      </section>

      <section className={styles.notes}>
        <div className={styles.note}>
          <h3>Current delivery flow</h3>
          <p>ZIP artifacts are ready now. DMG support is the next release-quality improvement.</p>
        </div>
        <div className={styles.note}>
          <h3>Recommended architecture</h3>
          <p>Keep marketing and download pages outside the desktop-bundled product app.</p>
        </div>
      </section>
    </main>
  );
}
