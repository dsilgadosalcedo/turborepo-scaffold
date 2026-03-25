import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./button";

describe("Button", () => {
  test("renders children and defaults to type button", () => {
    const markup = renderToStaticMarkup(<Button>Ship it</Button>);

    expect(markup).toContain('type="button"');
    expect(markup).toContain("Ship it");
    expect(markup).toContain("rounded-full");
  });

  test("applies variant and size classes", () => {
    const markup = renderToStaticMarkup(
      <Button size="lg" variant="secondary">
        Continue
      </Button>,
    );

    expect(markup).toContain("Continue");
    expect(markup).toContain("h-12");
    expect(markup).toContain("bg-secondary");
  });
});
