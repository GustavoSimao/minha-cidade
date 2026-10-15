import { expect, test } from "@playwright/test";

import { myUsername, signIn, signOut, signUpFreshUser } from "./helpers";

/**
 * Fase 8 / B2 — ações de staff sobre perfis, pelo /admin:
 * selo institucional (I5/P13) e promoção/rebaixamento de moderador (M5).
 * Todas são exclusivas do admin e ficam na trilha de moderação (M7).
 */

/** Cria um alvo fresco e entra como admin (carla, do seed). */
async function freshTargetAsAdmin(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  await signUpFreshUser(page, request);
  const username = await myUsername(page);
  await signOut(page);

  await signIn(page, "carla@minhacidade.dev");
  await page.goto("/admin");
  await page.getByLabel("Username").fill(username);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText(`@${username}`)).toBeVisible();

  return username;
}

test("admin concede e revoga selo institucional (B2/I5)", async ({ page, request }) => {
  const username = await freshTargetAsAdmin(page, request);

  // Concede.
  await page.getByRole("button", { name: "Conceder selo institucional" }).click();
  await page.getByLabel("Nome do órgão").fill("Secretaria de Obras de Teste");
  await page.getByRole("dialog").getByRole("button", { name: "Conceder selo" }).click();
  await expect(page.getByText("Selo institucional concedido.")).toBeVisible();

  // O selo aparece no perfil público (P13).
  await page.goto(`/perfil/${username}`);
  await expect(page.getByText("Secretaria de Obras de Teste").first()).toBeVisible();

  // Revoga.
  await page.goto("/admin");
  await page.getByLabel("Username").fill(username);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: "Revogar selo" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Revogar selo" }).click();
  await expect(page.getByText("Selo institucional revogado.")).toBeVisible();
});

test("admin promove e rebaixa moderador (B2/M5)", async ({ page, request }) => {
  const username = await freshTargetAsAdmin(page, request);

  // Promove.
  await page.getByRole("button", { name: "Promover a moderador" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Promover" }).click();
  await expect(page.getByText("Perfil promovido a moderador.")).toBeVisible();
  await expect(page.getByText("Papel atual: Moderador")).toBeVisible();

  // O badge de moderação aparece no perfil público.
  await page.goto(`/perfil/${username}`);
  await expect(page.getByText("Moderação").first()).toBeVisible();

  // Rebaixa de volta.
  await page.goto("/admin");
  await page.getByLabel("Username").fill(username);
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByRole("button", { name: "Rebaixar a usuário" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Rebaixar" }).click();
  await expect(page.getByText("Perfil rebaixado a usuário comum.")).toBeVisible();
  await expect(page.getByText("Papel atual: Usuário comum")).toBeVisible();
});

test("moderador não vê as ações de conta (M5 — exclusivas do admin)", async ({ page }) => {
  // Marco é moderador no seed: acessa a fila, mas não as ações de perfil.
  await signIn(page, "marco@minhacidade.dev");
  await page.goto("/admin");

  await page.getByLabel("Username").fill("ana-souza");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("@ana-souza")).toBeVisible();
  await expect(
    page.getByText("Conceder selo e alterar papel são ações exclusivas da administração (M5)."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Conceder selo institucional" })).toHaveCount(0);
});

test("username inexistente não quebra a busca (B2)", async ({ page }) => {
  await signIn(page, "carla@minhacidade.dev");
  await page.goto("/admin");

  await page.getByLabel("Username").fill("usuario-que-nao-existe-xyz");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByRole("status").or(page.getByRole("alert"))).toContainText(
    "Nenhum perfil encontrado",
  );
});

/**
 * Jornada 6 do PRD (P13/B2): o órgão solicita o selo com evidência em
 * /solicitar-selo; o admin aprova na fila do /admin e o selo aparece no perfil.
 */
test("solicitação de selo: órgão pede, admin aprova, selo aparece (B2/P13)", async ({
  page,
  request,
}) => {
  await signUpFreshUser(page, request);
  const username = await myUsername(page);
  const orgao = `Secretaria de Teste ${Date.now()}`;

  // 1. O órgão pede o selo com link de evidência.
  await page.goto("/solicitar-selo");
  await page.getByLabel("Nome do órgão").fill(orgao);
  await page.getByLabel("Link oficial da evidência").fill("https://exemplo.gov.br/orgao");
  await page.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(page.getByText("Solicitação em análise")).toBeVisible();
  await expect(page.getByText(orgao, { exact: false }).first()).toBeVisible();

  // 2. O admin aprova na fila do /admin.
  await signOut(page);
  await signIn(page, "carla@minhacidade.dev");
  await page.goto("/admin");

  const pedido = page.locator("li").filter({ hasText: orgao });
  await expect(pedido).toBeVisible();
  await expect(pedido.getByText("https://exemplo.gov.br/orgao")).toBeVisible();
  await pedido.getByRole("button", { name: "Aprovar e conceder selo" }).click();

  // Aprovado = fora da fila de pendentes.
  await expect(pedido).toHaveCount(0);

  // 3. O selo aparece no perfil público.
  await page.goto(`/perfil/${username}`);
  await expect(page.getByText(orgao).first()).toBeVisible();
});

test("admin rejeita solicitação de selo com motivo (B2/P13)", async ({ page, request }) => {
  const credenciais = await signUpFreshUser(page, request);
  const orgao = `Secretaria Rejeitada ${Date.now()}`;

  await page.goto("/solicitar-selo");
  await page.getByLabel("Nome do órgão").fill(orgao);
  await page.getByLabel("Link oficial da evidência").fill("https://exemplo.gov.br/outro");
  await page.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(page.getByText("Solicitação em análise")).toBeVisible();

  await signOut(page);
  await signIn(page, "carla@minhacidade.dev");
  await page.goto("/admin");

  const pedido = page.locator("li").filter({ hasText: orgao });
  await pedido.getByLabel("Motivo da rejeição").fill("evidência não comprova o vínculo");
  await pedido.getByRole("button", { name: "Rejeitar" }).click();
  await expect(pedido).toHaveCount(0);

  // O requerente vê o motivo e pode reenviar.
  await signOut(page);
  await signIn(page, credenciais.email, credenciais.password);
  await page.goto("/solicitar-selo");
  await expect(page.getByText("foi rejeitada", { exact: false })).toBeVisible();
  await expect(page.getByText("evidência não comprova o vínculo")).toBeVisible();
});
