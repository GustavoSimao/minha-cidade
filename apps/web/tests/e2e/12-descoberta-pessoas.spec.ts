import { expect, test } from "@playwright/test";

import { SEED_PASSWORD, signIn } from "./helpers";

/**
 * Busca de pessoas (T3): nome ou @username pela projeção pública (I7),
 * com o botão de amizade por resultado — sem e-mail/telefone na tela.
 */
test("busca encontra perfil por nome e oferece ação de amizade", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);

  await page.goto("/amigos/buscar?q=carla");
  await expect(page.getByText("Carla Dias")).toBeVisible();
  await expect(page.getByText("@carla-dias")).toBeVisible();

  // Ação de amizade disponível no resultado (estado vem de GetRelationshipForViewer;
  // no seed Carla→Ana está pendente, então o Estado da Ana é "Aceitar pedido").
  await expect(
    page
      .getByRole("button", {
        name: /Adicionar amigo|Cancelar pedido enviado|Amigos \(desfazer\)|Aceitar pedido de amizade/,
      })
      .first(),
  ).toBeVisible();
});

test("busca por @username encontra o perfil", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);

  await page.goto("/amigos/buscar?q=bruno");
  await expect(page.getByText("Bruno Lima")).toBeVisible();
  await expect(page.getByText("@bruno-lima")).toBeVisible();
});

test("resultados não expõem e-mail nem telefone (I7)", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);

  await page.goto("/amigos/buscar?q=ana");
  await expect(page.getByText("ana@minhacidade.dev")).toHaveCount(0);
  await expect(page.getByText("(27) 99911-2222")).toHaveCount(0);
});

test("termo de 1 caractere é recusado sem consulta", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);

  await page.goto("/amigos/buscar?q=a");
  await expect(page.getByText("digite ao menos 2 caracteres para buscar")).toBeVisible();
});

test("sem resultados mostra estado vazio", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev", SEED_PASSWORD);

  await page.goto("/amigos/buscar?q=zzzxxxnaoexiste");
  await expect(page.getByText("Nenhum resultado")).toBeVisible();
});

test("visitante é mandado para o login", async ({ page }) => {
  await page.goto("/amigos/buscar");
  await expect(page).toHaveURL(/\/login\?next=%2Famigos%2Fbuscar|\/login\?next=\/amigos\/buscar/);
});
