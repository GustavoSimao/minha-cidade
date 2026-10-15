import { expect, test } from "@playwright/test";

import { signIn, signOut } from "./helpers";

/**
 * Amizades (Fase 6 / S1–S6): pedido, aceite e desfazer entre dois usuários.
 *
 * Normaliza o estado antes de agir (reexecutável sem db reset): o teste
 * termina com Daniel e Bruno amigos; na reexecução desfaz e refaz.
 */
test("ciclo de amizade: pendente → aceitar → amigos", async ({ page }) => {
  await signIn(page, "daniel@minhacidade.dev");
  await page.goto("/perfil/bruno-lima");

  // Estado normalizado: sem relação.
  const semRelacao = page.getByRole("button", { name: "Adicionar amigo" });
  if (await semRelacao.isVisible()) {
    // já está sem relação
  } else if (await page.getByRole("button", { name: "Amigos (desfazer)" }).isVisible()) {
    await page.getByRole("button", { name: "Amigos (desfazer)" }).click();
  } else {
    await page.getByRole("button", { name: "Cancelar pedido enviado" }).click();
  }
  await expect(page.getByRole("button", { name: "Adicionar amigo" })).toBeVisible();

  // Daniel envia pedido.
  await page.getByRole("button", { name: "Adicionar amigo" }).click();
  await expect(page.getByRole("button", { name: "Cancelar pedido enviado" })).toBeVisible();

  // Bruno aceita.
  await signOut(page);
  await signIn(page, "bruno@minhacidade.dev");
  await page.goto("/perfil/daniel-rocha");
  await page.getByRole("button", { name: "Aceitar pedido de amizade" }).click();
  await expect(page.getByRole("button", { name: "Amigos (desfazer)" })).toBeVisible();

  // Lista de amigos mostra o Daniel.
  await page.goto("/amigos/bruno-lima");
  await expect(page.getByRole("link", { name: /Daniel Rocha/ })).toBeVisible();
});

test("perfil sem relação mostra Adicionar amigo", async ({ page }) => {
  await signIn(page, "daniel@minhacidade.dev");
  await page.goto("/perfil/graca-lima");
  await expect(page.getByRole("button", { name: "Adicionar amigo" })).toBeVisible();
});
