import { afterEach, expect, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import React from "react";

GlobalRegistrator.register();
expect.extend(matchers);

if (!("matchMedia" in window)) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      addEventListener() {},
      addListener() {},
      dispatchEvent() {
        return false;
      },
      matches: false,
      media: "",
      onchange: null,
      removeEventListener() {},
      removeListener() {},
    }),
  });
}

if (!("ResizeObserver" in globalThis)) {
  class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  Object.assign(globalThis, { ResizeObserver });
}

if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserver {
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  }

  Object.assign(globalThis, { IntersectionObserver });
}

if (!("scrollTo" in window)) {
  Object.assign(window, { scrollTo() {} });
}

mock.module("next/image", () => ({
  default: ({ alt, priority: _priority, src, ...props }) =>
    React.createElement("img", {
      alt,
      src: typeof src === "string" ? src : src?.src,
      ...props,
    }),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});
