import { describe, expect, it } from "vitest";
import { sanitizeSlug } from "@/lib/slug";

describe("sanitizeSlug", () => {
  it("normaliza a [a-z0-9-]", () => {
    expect(sanitizeSlug("Café Molienda")).toBe("cafe-molienda");
    expect(sanitizeSlug("Tacos  El Güero!!")).toBe("tacos-el-guero-");
    expect(sanitizeSlug("mi-negocio-2")).toBe("mi-negocio-2");
  });
});
