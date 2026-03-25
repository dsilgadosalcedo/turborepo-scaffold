import { describe, expect, test } from "bun:test";
import { cn } from "./utils";

describe("cn", () => {
  test("merges Tailwind class conflicts predictably", () => {
    expect(cn("px-2", "px-4", "text-sm", null)).toBe("px-4 text-sm");
  });
});
