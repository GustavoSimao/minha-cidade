import { expect, test } from "@playwright/test";

import { publish, signIn, signOut, signUpFreshUser } from "./helpers";

/**
 * Moderação (Fase 7 / P10/P21/M5/M7): denúncias empilham na fila, staff
 * oculta o conteúdo e terceiros passam a ver 404 (silencioso).
 *
 * Fluxo autônomo: cria vítima + 3 denunciantes novos, para rodar quantas
 * vezes quiser sem depender do estado do seed.
 */
test("denúncias empilham na fila e o staff oculta o conteúdo", async ({ page, request }) => {
  // 1. Vítima publica.
  await signUpFreshUser(page, request);
  const titulo = `Alvo de moderacao ${Date.now()}`;
  const url = await publish(page, {
    title: titulo,
    content: "Conteudo que sera denunciado tres vezes para cair na fila de moderacao.",
    neighborhood: "Boa Sorte",
  });

  // A sessão da vítima precisa sair antes do próximo cadastro: /cadastro
  // redireiona para a home (o feed) quando já existe sessão.
  await signOut(page);

  // 2. Três usuários distintos denunciam (M2: uma denúncia por alvo).
  for (let i = 0; i < 3; i += 1) {
    const denunciante = await signUpFreshUser(page, request, {
      name: `Denunciante ${i} ${Date.now()}`,
    });
    await page.goto(url);
    await page.getByLabel("Motivo").selectOption("spam");
    await page.getByRole("button", { name: "Enviar denúncia" }).click();
    await expect(page.getByText("Denúncia registrada")).toBeVisible();
    await signOut(page);
    void denunciante;
  }

  // 3. Staff (admin do seed) vê o alvo na fila.
  await signIn(page, "carla@minhacidade.dev");
  await page.goto("/admin");
  const item = page.locator("li").filter({ hasText: titulo });
  await expect(item).toBeVisible();
  await expect(item).toContainText("3 denúncia(s)");

  // 4. Oculta o conteúdo.
  await item.getByRole("button", { name: "Ocultar" }).click();
  await expect(item).toContainText("oculto");

  // 5. Anônimo (sessão encerrada) vê 404 silencioso (P21).
  await signOut(page);
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

test("usuário comum não acessa /admin (404 silencioso)", async ({ page }) => {
  await signIn(page, "bruno@minhacidade.dev");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
