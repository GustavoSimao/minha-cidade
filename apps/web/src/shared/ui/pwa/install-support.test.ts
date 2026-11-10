import { describe, expect, it } from "vitest";

import { installMode, type InstallEnvironment } from "./install-support";

const base: InstallEnvironment = {
  userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile",
  maxTouchPoints: 5,
  displayStandalone: false,
  iosStandalone: false,
};

describe("installMode (PWA)", () => {
  it("Android/Chrome aguarda o beforeinstallprompt", () => {
    expect(installMode(base)).toBe("prompt");
  });

  it("iPhone recebe a dica do Safari", () => {
    expect(installMode({ ...base, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" })).toBe("ios");
  });

  it("iPadOS (se apresenta como Mac com toque) também é iOS", () => {
    expect(installMode({ ...base, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" })).toBe("ios");
  });

  it("Mac de verdade (sem toque) usa o prompt", () => {
    expect(
      installMode({ ...base, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 0 }),
    ).toBe("prompt");
  });

  it("já instalado não oferece nada", () => {
    expect(installMode({ ...base, displayStandalone: true })).toBe("installed");
    expect(installMode({ ...base, userAgent: "iPhone", iosStandalone: true })).toBe("installed");
  });
});
