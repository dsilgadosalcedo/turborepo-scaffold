import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

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

describe("docs home page", () => {
  test("renders the getting-started content and CTA", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("Get started by editing");
    expect(markup).toContain("Open alert");
    expect(markup).toContain("Read our docs");
  });
});
