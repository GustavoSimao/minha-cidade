import { expect, test } from "@playwright/test";

import { SEED_PASSWORD, signIn, signOut, signUpFreshUser } from "./helpers";

/**
 * Cadastro com confirmação de e-mail e login (Fase 2 / P2/P3/P22).
 * Roda nos dois viewports (mobile 375 e desktop 1280).
 */
test("cadastro confirma e-mail pelo Mailpit e abre sessão no feed", async ({ page, request }) => {
  await signUpFreshUser(page, request);

  // Cabeçalho de usuário logado: "Publicar" e "Sair" visíveis.
  await expect(page.getByRole("link", { name: "Publicar" }).first()).toBeVisible();
});

test("login com e-mail e senha usa usuário do seed", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev");
  await expect(page.getByRole("heading", { name: "Feed do bairro" })).toBeVisible();
});

test("login inválido mostra erro e mantém visitante", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("ana@minhacidade.dev");
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "incorretos" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
});

test("sair encerra a sessão", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev");
  await signOut(page);
  await expect(page.getByRole("link", { name: "Criar conta" })).toBeVisible();
});

test("visitante anônimo lê o feed (P4)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Feed do bairro" })).toBeVisible();
  // Sem depender de paginação: o feed lista publicações (limite 20, recente
  // primeiro) — a existência de cards já prova a leitura anônima.
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page.locator("article a[href^='/publicacao/']").first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
});

// Reexport para os demais specs usarem a mesma constante de senha do seed.
export { SEED_PASSWORD };
