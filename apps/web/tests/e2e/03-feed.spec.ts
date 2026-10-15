import { expect, test } from "@playwright/test";

/**
 * Feed público (Fase 4 / P8): leitura anônima, filtros por query string
 * (cidade/tipo/bairro) e selo institucional no perfil (P13).
 */
test("feed anônimo lista publicações do seed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Feed do bairro" })).toBeVisible();
  // Sem depender de paginação: o feed lista cards (limite 20, recente
  // primeiro) — publicações acumuladas de outras execuções empurrariam os
  // títulos do seed para a página 2. O conteúdo do seed é verificado pelos
  // filtros abaixo, que são determinísticos (cidade/tipo únicos).
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page.locator("article a[href^='/publicacao/']").first()).toBeVisible();
});

test("filtro por tipo mostra apenas ideias", async ({ page }) => {
  await page.goto("/?tipo=idea");
  const articles = page.locator("article");
  await expect(articles.first()).toBeVisible();
  await expect(articles.getByText("Ideia", { exact: true }).first()).toBeVisible();
  // Nenhum "Problema" nos cards visíveis.
  await expect(articles.getByText("Problema", { exact: true })).toHaveCount(0);
});

test("filtro por cidade mostra apenas publicações da cidade", async ({ page }) => {
  // 3205309 = Vitória/ES (IBGE) — a publicação da ciclovia é a única de fora de Cariacica.
  await page.goto("/?cidade=3205309");
  await expect(page.getByText("Ciclovia ligando o Centro", { exact: false })).toBeVisible();
  await expect(page.getByText("Buraco na Rua Principal", { exact: false })).toHaveCount(0);
});

test("canal institucional da prefeitura aparece com selo no perfil (P13)", async ({ page }) => {
  await page.goto("/perfil/prefeitura-cariacica");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prefeitura de Cariacica");
  await expect(page.getByText("Prefeitura de Cariacica", { exact: true }).nth(1)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Recapeamento da Avenida Central/ })).toBeVisible();
});

test("filtros pela interface navegam pelo query string (T4)", async ({ page }) => {
  await page.goto("/");

  // Cidade: busca + escolha no resultado.
  await page.getByLabel("Cidade").fill("Cariacica");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page.getByRole("button", { name: "Cariacica — ES" }).click();
  await expect(page).toHaveURL(/cidade=3201308/);

  // Bairro: select em cascata aparece com a cidade definida.
  await expect(page.getByLabel("Bairro")).toBeVisible();
  await page.getByLabel("Bairro").selectOption({ label: "Boa Sorte" });
  await expect(page).toHaveURL(/bairro=/);

  // Tipo: alterna para Problemas e o query string acompanha.
  await page.getByRole("button", { name: "Problemas" }).click();
  await expect(page).toHaveURL(/tipo=problem/);
  await expect(page.getByText("Problema", { exact: true }).first()).toBeVisible();

  // Limpar volta para o feed sem filtros.
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("filtro sem resultado mostra estado vazio honesto (T4)", async ({ page }) => {
  // Cariacica (3201308) com bairro inexistente: a cidade tem publicações, mas
  // nenhuma naquele bairro — o feed esvazia sem mentir para o usuário.
  await page.goto("/?cidade=3201308&bairro=00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Nenhum resultado para os filtros")).toBeVisible();
});

test("bairro sem cidade canonicaliza com a cidade dona do bairro", async ({ page, request }) => {
  // UUID de bairro muda a cada db reset — pega o primeiro bairro do seed pela API.
  const response = await request.get("/api/geography/neighborhoods?cityId=3201308");
  const neighborhoods: { id: string }[] = (await response.json()).neighborhoods;
  const neighborhood = neighborhoods[0];

  expect(neighborhood, "seed de bairros de Cariacica deveria existir").toBeTruthy();

  // Sem canonicalizar, o filtro funciona no servidor mas o seletor de bairro
  // não inicializa (a cascata precisa da cidade na URL).
  await page.goto(`/?bairro=${neighborhood.id}`);
  await expect(page).toHaveURL(
    new RegExp(`cidade=3201308&bairro=${neighborhood.id}`),
  );
});

test("canal institucional aparece com selo no feed e na publicação (P13/T5)", async ({ page }) => {
  // Card do feed: publicação oficial do seed em Cariacica (3201308) na
  // primeira página — precondição db reset antes da suíte (como no CI).
  await page.goto("/?cidade=3201308");
  const card = page.locator("article").filter({ hasText: "Recapeamento da Avenida Central" });
  await expect(card.getByTestId("institutional-badge")).toHaveText("Prefeitura de Cariacica");

  // Página da publicação: UUID fixo do seed (determinístico).
  await page.goto("/publicacao/bbbbbbbb-0001-4000-8000-000000000005");
  await expect(
    page.getByRole("heading", { level: 1, name: /Recapeamento da Avenida Central/ }),
  ).toBeVisible();

  // Autor da publicação (escopado no article — o comentário oficial abaixo
  // também tem selo, por isso o teste não pode usar o testid solto).
  await expect(
    page.getByRole("article").getByTestId("institutional-badge"),
  ).toHaveText("Prefeitura de Cariacica");

  // Comentário do canal oficial na mesma página (P13 — Task 1).
  const comentarioOficial = page
    .locator("li")
    .filter({ hasText: "Atendemos a demanda: a obra estava prevista" });
  await expect(comentarioOficial.getByTestId("institutional-badge")).toHaveText(
    "Prefeitura de Cariacica",
  );

  await expect(page.getByRole("link", { name: /Prefeitura de Cariacica/ }).first()).toBeVisible();
});
