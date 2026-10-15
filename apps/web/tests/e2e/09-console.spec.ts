import { expect, test } from "@playwright/test";

import { collectPageErrors, signIn } from "./helpers";

/**
 * Sem erros de console/pageerror nas rotas principais (rodar "100% local
 * sem erros" inclui o console do navegador).
 */
test("nenhum erro de console nas rotas principais", async ({ page }) => {
  const errors = collectPageErrors(page);

  // A home já é o feed — `/feed` redireciona para `/`.
  await page.goto("/");
  await page.goto("/transparencia");
  await page.goto("/termos");
  await page.goto("/privacidade");
  await page.goto("/login");
  await page.goto("/cadastro");
  await page.goto("/publicacao/nao-existe-404");

  await signIn(page, "ana@minhacidade.dev");
  await page.goto("/perfil/ana-souza");
  await page.goto("/amigos/ana-souza");
  await page.goto("/publicar");
  await page.goto("/perfil/editar");
  await page.goto("/salvos");
  await page.goto("/notificacoes");
  await page.goto("/amigos/solicitacoes");

  // Ignora apenas erro esperado de rota inexistente (404 do Next).
  const relevant = errors.filter((e) => !/404|Failed to load resource/.test(e));
  expect(relevant, relevant.join("\n")).toEqual([]);
});
