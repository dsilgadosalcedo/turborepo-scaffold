import { describe, expect, test } from "bun:test";
import { getLabel } from "./desktop-update-button";

describe("getLabel", () => {
  test("returns the checking label", () => {
    expect(getLabel({ status: "checking" })).toBe("Buscando actualizacion");
  });

  test("returns download progress when the percent is known", () => {
    expect(getLabel({ percent: 51.2, status: "downloading" })).toBe("Descargando 51%");
  });

  test("returns the install label once the update is ready", () => {
    expect(getLabel({ status: "downloaded", version: "1.2.3" })).toBe("Actualizar");
  });
});
