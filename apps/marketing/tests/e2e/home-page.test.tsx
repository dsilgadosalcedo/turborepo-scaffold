import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

process.env.NEXT_PUBLIC_PRODUCT_WEB_URL = "https://turborepo-scaffold-web.vercel.app";

mock.module("../../app/page.module.css", () => ({
  default: new Proxy(
    {},
    {
      get: (_target, property) => String(property),
    },
  ),
}));

mock.module("next/image", () => ({
  default: ({
    alt,
    priority: _priority,
    src,
    ...props
  }: {
    alt?: string;
    priority?: boolean;
    src?: { src?: string } | string;
  } & Record<string, unknown>) =>
    React.createElement("img", {
      alt,
      src: typeof src === "string" ? src : src?.src,
      ...props,
    }),
}));

const { default: Home } = await import("../../app/page");

describe("marketing home page", () => {
  test("renders the scaffold marketing content and CTA", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("A real marketing app, a real product app, and a desktop shell.");
    expect(markup).toContain("Download desktop");
    expect(markup).toContain("apps/marketing");
  });
});
