import { expect, test } from "@playwright/test";
import { join } from "node:path";

import { publish, signUpFreshUser } from "./helpers";

const FIXTURE = join(__dirname, "fixtures", "foto.png");

/**
 * Publicar (Fase 4 / P5/V1): formulário problema/ideia, bairro, foto e
 * verificação da publicação no feed.
 *
 * Usa usuário novo em cada teste: o seed do Bruno já tem publicações e o
 * limite de 5 publicações/hora (P16) barraria a 6ª numa segunda execução.
 */
test("publicar problema com foto aparece no feed", async ({ page, request }) => {
  await signUpFreshUser(page, request);

  const titulo = `Buraco na rua de teste ${Date.now()}`;
  const url = await publish(page, {
    title: titulo,
    content:
      "Buraco enorme na frente da padaria atrapalhando a passagem de carros e motos.",
    neighborhood: "Aparecida",
    photoPath: FIXTURE,
  });

  expect(url).toMatch(/\/publicacao\/[0-9a-f-]+$/);
  // Filtra pelo nome: a página do autor também tem os h1 "Editar publicação"
  // e "Comentar" no DOM.
  await expect(page.getByRole("heading", { level: 1, name: titulo })).toHaveText(titulo);
  await expect(page.getByText("Cariacica — ES, Aparecida")).toBeVisible();

  // Confirma no feed.
  await page.goto("/");
  await expect(page.getByRole("link", { name: titulo })).toBeVisible();
});

test("publicar ideia em cidade sem curadoria mostra Bairro não informado (P12/G6)", async ({ page, request }) => {
  await signUpFreshUser(page, request);

  // Vitória/ES (IBGE 3205309) não tem bairros curados: bairro é opcional.
  const titulo = `Ideia de teste ${Date.now()}`;
  const url = await publish(page, {
    type: "idea",
    title: titulo,
    content: "Sugiro uma biblioteca comunitária no salão da paróquia aos sábados.",
    city: { name: "Vitória", uf: "ES" },
  });

  expect(url).toMatch(/\/publicacao\/[0-9a-f-]+$/);
  // A linha de local da publicação já carrega os dois fatos (cidade sem
  // curadoria + bairro não informado). A página do autor também monta o
  // seletor de local do formulário de edição, que repete a cidade em badge —
  // por isso o match é pela string completa, não por substring.
  await expect(page.getByText("Vitória — ES, Bairro não informado")).toBeVisible();
});

test("publicação anônima preserva o anonimato no feed (P4)", async ({ page, request }) => {
  await signUpFreshUser(page, request);

  const titulo = `Relato anonimo ${Date.now()}`;
  await publish(page, {
    title: titulo,
    content: "Relato anonimo para verificar que o autor nao aparece no feed publico.",
    neighborhood: "Boa Sorte",
    anonymous: true,
  });

  await page.goto("/");
  const card = page.locator("article").filter({ hasText: titulo });
  await expect(card.getByText("Morador anônimo")).toBeVisible();
});
