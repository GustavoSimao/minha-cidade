import { expect, test, type Page } from "@playwright/test";

import { SEED_PASSWORD, myUsername, signIn, signOut, signUpFreshUser } from "./helpers";

/**
 * Hub de amizades (S1–S6): abas com contadores, enviar de sugestão, pular sem
 * repetir na descoberta e opt-out de bairro (D-6).
 *
 * Premissa: seed fresco — Ana (Boa Sorte) tem 1 amigo (Bruno) e 1 solicitação
 * recebida (Carla). Os testes que MUTAM estado usam usuários frescos: a suíte
 * roda em dois viewports em paralelo contra o mesmo banco e mexer no seed
 * colidiria entre os projetos.
 */

/** Escolhe Cariacica + bairro no formulário de perfil (mesmo fluxo de 07-perfil). */
async function escolherBairro(page: Page, bairro: string) {
  await page.getByLabel("Cidade").fill("Cariacica");
  await page.getByRole("button", { name: "Cariacica — ES" }).click();
  await page.getByLabel("Bairro").selectOption({ label: bairro });
}

test("hub tem 3 abas com contadores e lista os amigos", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);
  await page.goto("/amigos");

  await expect(page.getByRole("heading", { level: 1, name: "Amigos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Amigos (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Solicitações (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Sugestões \(\d+\)$/ })).toBeVisible();

  await expect(page.locator("li").filter({ hasText: "Bruno Lima" })).toBeVisible();
  await expect(
    page
      .locator("li")
      .filter({ hasText: "Bruno Lima" })
      .getByRole("button", { name: "Amigos (desfazer)" }),
  ).toBeVisible();
});

test("aba de solicitações mostra a recebida com aceitar/recusar", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);
  await page.goto("/amigos?tab=solicitacoes");

  await expect(page.getByRole("heading", { name: "Recebidas" })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: "Carla Dias" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aceitar pedido de amizade" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Enviadas" })).toBeVisible();
});

test("opt-out de bairro continua sugerível, mas esconde o bairro (D-6)", async ({
  page,
  request,
}) => {
  // Pessoa 1: mesmo bairro da sugestão, com a exibição do bairro DESLIGADA.
  await signUpFreshUser(page, request);
  const invisivel = await myUsername(page);

  await page.goto("/perfil/editar");
  await escolherBairro(page, "Boa Sorte");
  await page.getByRole("checkbox", { name: /Mostrar onde eu moro/ }).uncheck();
  await page.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();

  await signOut(page);

  // Pessoa 2: mesmo bairro, exibição ligada — recebe a sugestão da pessoa 1.
  await signUpFreshUser(page, request);
  await page.goto("/perfil/editar");
  await escolherBairro(page, "Boa Sorte");
  await page.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();

  await page.goto("/amigos?tab=sugestoes");
  await expect(page.locator("li").filter({ hasText: `@${invisivel}` })).toBeVisible();

  // O bairro da pessoa 1 não aparece no perfil público (I7 condicional).
  await page.goto(`/perfil/${invisivel}`);
  await expect(page.getByText("Cariacica", { exact: false })).toBeVisible();
  await expect(page.getByText("Boa Sorte")).toHaveCount(0);
});

test("enviar de sugestão aparece em Enviadas com cancelar", async ({ page, request }) => {
  // Usuário fresco no Boa Sorte: as sugestões são os vizinhos do seed
  // (Daniel/Elena) — estáveis entre passagens e projetos.
  await signUpFreshUser(page, request);
  await page.goto("/perfil/editar");
  await escolherBairro(page, "Boa Sorte");
  await page.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();

  await page.goto("/amigos?tab=sugestoes");
  const primeira = page.locator("li").first();
  await expect(primeira).toBeVisible();
  await primeira.getByRole("button", { name: "Adicionar amigo" }).click();

  await page.getByRole("link", { name: /^Solicitações/ }).click();
  await expect(page).toHaveURL(/tab=solicitacoes/);

  // O pedido enviado aparece em "Enviadas" com a opção de cancelar (C2).
  await expect(page.getByRole("heading", { name: "Enviadas" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancelar pedido enviado" }).first(),
  ).toBeVisible();
});

test("descobrir pessoas mostra 5 cartões e pular não repete", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);
  await page.goto("/amigos/descobrir");

  const cartoes = page.locator('li a[href^="/perfil/"]');
  await expect(cartoes).toHaveCount(5);

  const primeira = await cartoes.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );

  await page.getByRole("link", { name: "Pular estes e ver outras pessoas" }).click();
  await expect(page).toHaveURL(/exclude=/);

  const segunda = await page.locator('li a[href^="/perfil/"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );

  expect(segunda.filter((href) => primeira.includes(href))).toEqual([]);
});

test("sem bairro no perfil, a aba de sugestões convida a escolher (D-8)", async ({
  page,
  request,
}) => {
  await signUpFreshUser(page, request);

  await page.goto("/amigos?tab=sugestoes");
  await expect(page.getByText("Sem bairro no perfil")).toBeVisible();
  await expect(page.getByRole("link", { name: "Escolher meu bairro" })).toBeVisible();
});

test("visitante é mandado para o login", async ({ page }) => {
  await page.goto("/amigos");
  await expect(page).toHaveURL(/\/login\?next=%2Famigos|\/login\?next=\/amigos/);
});
