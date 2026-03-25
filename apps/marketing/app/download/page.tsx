import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "../../env.js";
import styles from "./page.module.css";

type DownloadOption = {
  description: string;
  format: string;
  href: string;
  note: string;
  platform: string;
  title: string;
};

function getDesktopVersion() {
  const packagePath = path.resolve(process.cwd(), "..", "desktop", "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version: string };

  return packageJson.version;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/u, "");
}

function getDownloadOptions(): DownloadOption[] {
  const baseUrl = trimTrailingSlash(env.AUTO_UPDATE_BASE_URL);
  const version = getDesktopVersion();

  return [
    {
      description: "Recommended for Apple Silicon Macs.",
      format: ".dmg",
      href: `${baseUrl}/darwin/arm64/desktop.dmg`,
      note: "Includes the polished drag-to-Applications install flow.",
      platform: "macOS",
      title: "Apple Silicon (arm64)",
    },
    {
      description: "For Intel-based Macs.",
      format: ".dmg",
      href: `${baseUrl}/darwin/x64/desktop.dmg`,
      note: "Separate Intel build so older Macs get the right native package.",
      platform: "macOS",
      title: "Intel (x64)",
    },
    {
      description: "Installer with background update support.",
      format: ".exe",
      href: `${baseUrl}/win32/x64/desktop-${version} Setup.exe`,
      note: "Built for current Windows desktop releases.",
      platform: "Windows",
      title: "Windows 10, 11",
    },
  ];
}

export const metadata: Metadata = {
  title: "Download Desktop",
  description: "Download the desktop app for macOS and Windows.",
};

export default function DownloadPage() {
  const desktopVersion = getDesktopVersion();
  const downloadOptions = getDownloadOptions();

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
        <p className={styles.version}>Current desktop version: v{desktopVersion}</p>
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
            <p className={styles.noteText}>{option.note}</p>
            <a className={styles.button} href={option.href}>
              Download {option.format}
            </a>
          </article>
        ))}
      </section>

      <section className={styles.notes}>
        <div className={styles.note}>
          <h3>Installer strategy</h3>
          <p>
            DMG and EXE are for first-time downloads. ZIP artifacts still matter on macOS because
            the updater consumes them behind the scenes.
          </p>
        </div>
        <div className={styles.note}>
          <h3>Architecture</h3>
          <p>
            Marketing stays separate from the packaged product app, so desktop ships only the app.
          </p>
        </div>
      </section>

      <section className={styles.footerCtas}>
        <Link className={styles.inlineLink} href="/">
          Back to marketing home
        </Link>
        <a
          className={styles.inlineLink}
          href={`${trimTrailingSlash(env.AUTO_UPDATE_BASE_URL)}/darwin/arm64/desktop-darwin-arm64-${desktopVersion}.zip`}
        >
          Direct macOS ZIP
        </a>
      </section>
    </main>
  );
}
