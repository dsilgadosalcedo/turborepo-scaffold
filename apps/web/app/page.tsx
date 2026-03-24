import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { DesktopUpdateButton } from "@repo/ui/desktop-update-button";

const pillars = [
  {
    description:
      "The browser and desktop app both run the same Next.js application. Electron is only the shell.",
    title: "One UI Surface",
  },
  {
    description:
      "In development, Electron opens localhost:3000 so hot reload feels exactly like normal next dev.",
    title: "Fast Development",
  },
  {
    description:
      "In production, Electron loads the bundled standalone server internally, so API routes and server actions still work offline.",
    title: "Full Next Runtime",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(196,151,92,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.12),_transparent_30%)]" />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
        <header className="rounded-[2rem] border bg-card/90 p-6 shadow-[0_24px_80px_-36px_rgba(31,41,55,0.55)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary">Next.js</Badge>
                  <Badge variant="secondary">Electron</Badge>
                  <Badge variant="secondary">Turborepo</Badge>
                  <Badge variant="secondary">Standalone</Badge>
                  <Badge variant="secondary">Auto Updates</Badge>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                  One Next.js app, shared across web and desktop
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  This starter keeps the browser app and the desktop app on the same Next.js code
                  path. Electron stays focused on native responsibilities, while the product UI
                  lives in one place.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start">
                <DesktopUpdateButton />
                <Button variant="secondary">Nueva radicacion</Button>
              </div>
            </div>

            <Card className="border-border/70 bg-secondary/40">
              <CardHeader>
                <CardTitle>Update behavior</CardTitle>
                <CardDescription>
                  Updates download automatically in the background on desktop. When a release is
                  ready and the app is still open, this header shows an <strong>Actualizar</strong>{" "}
                  button so the user can restart and apply it immediately.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="border-border/70 bg-card/85">
              <CardHeader>
                <CardTitle>{pillar.title}</CardTitle>
                <CardDescription>{pillar.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>Desktop runtime model</CardTitle>
              <CardDescription>
                The Electron process handles native concerns only: windowing, updates, and running
                the bundled standalone Next server in production.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border bg-muted/35 px-4 py-3">
                Development: `bun dev` starts Next on port 3000 and Electron opens that URL.
              </div>
              <div className="rounded-2xl border bg-muted/35 px-4 py-3">
                Production: `bun build` creates the standalone Next output and packages it inside
                Electron.
              </div>
              <div className="rounded-2xl border bg-muted/35 px-4 py-3">
                Updates: Electron auto-updates check on startup, download in the background, and can
                install on quit or via the header button.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>Why this is the right split</CardTitle>
              <CardDescription className="text-primary-foreground/75">
                Your UI stays shared and your desktop-specific logic stays isolated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl bg-black/10 px-4 py-3">
                `packages/ui` owns reusable shadcn-style primitives.
              </div>
              <div className="rounded-2xl bg-black/10 px-4 py-3">
                `apps/web` owns routes, layouts, API routes, and server actions.
              </div>
              <div className="rounded-2xl bg-black/10 px-4 py-3">
                `apps/desktop` owns Electron main, preload, packaging, and updates.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
