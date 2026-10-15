import { describe, expect, it } from "vitest";

import { ReportReason } from "./report-reason";
import { ModerationAction } from "./report-reason";
import { DAILY_PUBLICATION_LIMIT, RateLimitPolicy } from "./rate-limit-policy";

describe("ReportReason (M3)", () => {
  it("aceita os seis motivos fechados", () => {
    for (const reason of [
      "spam",
      "discurso_odio",
      "informacao_falsa",
      "conteudo_ilegal",
      "assedio",
      "outro",
    ]) {
      expect(ReportReason.create(reason).value).toBe(reason);
    }
  });

  it("rejeita motivo fora do conjunto", () => {
    expect(() => ReportReason.create("xingamento")).toThrow("motivo de denúncia inválido");
    expect(() => ReportReason.create("")).toThrow("motivo de denúncia inválido");
  });

  it("tem rótulo em português", () => {
    expect(ReportReason.create("spam").label).toBe("Spam ou propaganda");
  });
});

describe("ModerationAction (M5)", () => {
  it("remover exige admin; ocultar/restaurar exigem moderador", () => {
    expect(ModerationAction.create("hide").requiredRole).toBe("moderator");
    expect(ModerationAction.create("restore").requiredRole).toBe("moderator");
    expect(ModerationAction.create("remove").requiredRole).toBe("admin");
  });

  it("rejeita ação inválida", () => {
    expect(() => ModerationAction.create("banir")).toThrow("ação de moderação inválida");
  });
});

describe("RateLimitPolicy (M9/P16)", () => {
  it("janela de hora começa na hora cheia", () => {
    const policy = RateLimitPolicy.of("comment");
    const start = policy.windowStart(new Date("2026-10-12T14:37:12.000Z"));

    expect(start.toISOString()).toBe("2026-10-12T14:00:00.000Z");
  });

  it("janela de dia começa na meia-noite UTC", () => {
    const policy = RateLimitPolicy.of("publication", "day");
    const start = policy.windowStart(new Date("2026-10-12T14:37:12.000Z"));

    expect(start.toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });

  it("aplica os tetos do produto", () => {
    expect(RateLimitPolicy.of("publication").limit).toBe(5);
    expect(RateLimitPolicy.of("publication", "day").limit).toBe(DAILY_PUBLICATION_LIMIT);
    expect(RateLimitPolicy.of("comment").limit).toBe(20);
    expect(RateLimitPolicy.of("report").limit).toBe(10);
  });

  it("bloqueia ao atingir o teto", () => {
    const policy = RateLimitPolicy.of("publication");

    expect(policy.isExceeded(4)).toBe(false);
    expect(policy.isExceeded(5)).toBe(true);
  });
});
