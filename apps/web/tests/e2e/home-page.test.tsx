import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@repo/ui/desktop-update-button", () => ({
  DesktopUpdateButton() {
    return null;
  },
}));

const { default: Home } = await import("../../app/page");

describe("web home page", () => {
  test("renders the main product story", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("One Next.js app, shared across web and desktop");
    expect(markup).toContain("One UI Surface");
    expect(markup).toContain("Desktop runtime model");
    expect(markup).toContain("Why this is the right split");
  });
});
