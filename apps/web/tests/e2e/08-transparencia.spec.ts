import { expect, test } from "@playwright/test";

/**
 * Transparência (P20) — Fase 10 (B3).
 *
 * A página lê os snapshots diários (`analytics.daily_metrics`, gerados pelo job
 * pg_cron/backfill do seed) e mostra só contagens agregadas.
 */
test("transparência mostra números agregados sem dado pessoal", async ({ page }) => {
  await page.goto("/transparencia");

  await expect(page.getByRole("heading", { name: "Transparência" })).toBeVisible();

  // Cards de totais (valores são inteiros >= 0).
  await expect(page.getByText("Publicações", { exact: true })).toBeVisible();
  await expect(page.getByText("Denúncias", { exact: true })).toBeVisible();
  await expect(page.getByText("Ações de moderação", { exact: true })).toBeVisible();

  // Gráficos (recharts) renderizam os eixos.
  await expect(page.getByRole("heading", { name: "Publicações por dia" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Denúncias e ações de moderação" }),
  ).toBeVisible();

  // P20: nenhum texto de publicação, e-mail ou username.
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("@minhacidade.dev");
  expect(body).not.toContain("Buraco na Rua Principal");
  expect(body).not.toContain("usuario-e2e");
});

test("transparência é pública (leitura anônima)", async ({ page }) => {
  // Sem sessão: a página carrega normalmente.
  await page.goto("/transparencia");
  await expect(page.getByText("Atualizado em")).toBeVisible();
});
