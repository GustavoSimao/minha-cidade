import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

/**
 * Engajamento (Fase 5 / E1/E3/E4/E6): apoio/oposição, comentário e
 * salvamento na página da publicação.
 *
 * Normaliza o estado antes de agir (o teste é reexecutável sem db reset):
 * se o usuário já apoiou/salvou, desfaz primeiro.
 */
test("apoiar, comentar e salvar uma publicação", async ({ page }) => {
  await signIn(page, "daniel@minhacidade.dev");

  // Usa a publicação do seed da Ana. Entra pelo perfil dela: o feed é paginado
  // (20 recentes) e publicações de testes acumulados empurram o seed para a
  // página 2 — o perfil do autor lista as dele, sem depender da ordem global.
  const tituloSeed = "Buraco na Rua Principal atrapalha o trânsito";
  await page.goto("/perfil/ana-souza");
  await page.getByRole("link", { name: tituloSeed, exact: true }).click();
  await expect(page).toHaveURL(/\/publicacao\//);

  // --- Apoio (toggle determinístico) ---
  const apoio = page.getByRole("button", { name: /^Apoio · \d+$/ }).first();
  if ((await apoio.getAttribute("aria-pressed")) === "true") {
    await apoio.click();
    await expect(apoio).toHaveAttribute("aria-pressed", "false");
  }
  const inicial = Number((await apoio.textContent())?.match(/(\d+)/)?.[1] ?? "0");
  await apoio.click();
  await expect(page.getByRole("button", { name: `Apoio · ${inicial + 1}` })).toBeVisible();
  await expect(apoio).toHaveAttribute("aria-pressed", "true");

  // --- Comentário identificado ---
  const comentario = `Comentario de teste ${Date.now()}`;
  await page.getByLabel("Comentário").fill(comentario);
  await page.getByRole("button", { name: "Publicar comentário" }).click();
  await expect(page.getByText(comentario)).toBeVisible();

  // --- Salvar (normaliza se já estiver salvo) ---
  if (await page.getByRole("button", { name: "Salvo (remover)" }).isVisible()) {
    await page.getByRole("button", { name: "Salvo (remover)" }).click();
    await expect(page.getByRole("button", { name: "Salvar para depois" })).toBeVisible();
  }
  await page.getByRole("button", { name: "Salvar para depois" }).click();
  await expect(page.getByRole("button", { name: "Salvo (remover)" })).toBeVisible();

  await page.goto("/salvos");
  await expect(page.getByRole("link", { name: tituloSeed, exact: true })).toBeVisible();
});

test("visitante anônimo não pode interagir (P3)", async ({ page }) => {
  await page.goto("/perfil/ana-souza");
  await page.getByRole("link", { name: "Buraco na Rua Principal atrapalha o trânsito", exact: true }).click();
  await expect(page.getByText("Entre na sua conta", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Comentário")).toHaveCount(0);
});

test("selo institucional aparece no comentário do canal oficial (P13)", async ({ page }) => {
  // UUID fixo do seed: a publicação tem comentário da prefeitura (selo) e do
  // fabio-neres (sem selo) — determinístico, sem depender da ordem do feed.
  await page.goto("/publicacao/bbbbbbbb-0001-4000-8000-000000000005");

  const comentarioOficial = page
    .locator("li")
    .filter({ hasText: "Atendemos a demanda: a obra estava prevista" });
  await expect(comentarioOficial.getByTestId("institutional-badge")).toHaveText(
    "Prefeitura de Cariacica",
  );

  const comentarioComum = page
    .locator("li")
    .filter({ hasText: "no acesso da escola" });
  await expect(comentarioComum.getByTestId("institutional-badge")).toHaveCount(0);
});
