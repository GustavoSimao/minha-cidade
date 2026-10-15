import { expect, type Page, type APIRequestContext } from "@playwright/test";

/**
 * Helpers compartilhados dos testes e2e.
 *
 * Premissas: stack local no ar com seed fresco (`npm run setup --prefix apps/web`)
 * e app rodando em http://localhost:3000 (o webServer do playwright.config sobe
 * o dev server automaticamente).
 *
 * Senha única dos usuários do seed: Cidade@123.
 */

export const SEED_PASSWORD = "Cidade@123";

/** Mailpit (captura de e-mails local da stack Supabase). */
const MAILPIT = "http://127.0.0.1:54324";

let counter = 0;

/** E-mail único por execução — não colide com o seed nem entre testes. */
export function uniqueEmail(): string {
  counter += 1;
  return `e2e-${Date.now()}-${counter}@minhacidade.dev`;
}

/** Nome legível (o username é gerado por slugify a partir dele). */
export function uniqueName(): string {
  counter += 1;
  return `Usuario E2E ${counter}`;
}

/**
 * Cadastra um usuário novo e confirma o e-mail pelo Mailpit.
 *
 * Sem confirmação não é possível escrever (P3). Devolve as credenciais para
 * login posterior em outros contextos de teste.
 */
export async function signUpFreshUser(
  page: Page,
  request: APIRequestContext,
  options: { name?: string; email?: string; password?: string } = {},
): Promise<{ email: string; password: string }> {
  const email = options.email ?? uniqueEmail();
  const password = options.password ?? SEED_PASSWORD;
  const name = options.name ?? uniqueName();

  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(
    page.getByText("Conta criada. Confirme seu e-mail", { exact: false }),
  ).toBeVisible();

  await confirmEmail(page, request, email);

  // Após a confirmação a sessão abre e cai na home (o feed).
  await expect(page).toHaveURL(/\/$/);
  await expectSignedIn(page);

  return { email, password };
}

/** Busca o e-mail de confirmação no Mailpit e abre o link (sessão abre). */
export async function confirmEmail(page: Page, request: APIRequestContext, email: string) {
  const deadline = Date.now() + 20_000;
  let link: string | null = null;

  while (Date.now() < deadline) {
    const search = await request
      .get(`${MAILPIT}/api/v1/search?query=to:${encodeURIComponent(email)}&limit=5`)
      .catch(() => null);
    if (search?.ok()) {
      const body = (await search.json()) as { messages?: { ID: string }[] };
      const id = body.messages?.[0]?.ID;
      if (id) {
        const message = await request.get(`${MAILPIT}/api/v1/message/${id}`);
        if (message.ok()) {
          const full = (await message.json()) as { HTML?: string };
          const match = full.HTML?.match(/href="([^"]*auth\/callback\?token_hash=[^"]*)"/);
          if (match) {
            link = match[1].replace(/&amp;/g, "&");
            break;
          }
        }
      }
    }
    await page.waitForTimeout(500);
  }

  expect(link, `e-mail de confirmação para ${email} não chegou no Mailpit`).not.toBeNull();
  await page.goto(link!);
  await expect(page).toHaveURL(/\/$/);
}

/** Login com e-mail/senha (usuários do seed ou criados no teste). */
export async function signIn(page: Page, email: string, password = SEED_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expectSignedIn(page);
}

/** Sai da sessão atual. */
export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  // Escopado no banner: no mobile a barra inferior também tem link "Entrar".
  await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
}

/** Confere que há sessão aberta (cabeçalho mostra "Sair"). */
export async function expectSignedIn(page: Page) {
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
}

/** Descobre o username logado pelo link de perfil do cabeçalho/barra inferior. */
export async function myUsername(page: Page): Promise<string> {
  // No mobile o cabeçalho esconde "Meu perfil" (`sm:`); a barra inferior tem
  // "Perfil". Os dois têm o mesmo href — o primeiro do DOM serve nos dois.
  const link = page
    .locator(
      'header a[href^="/perfil/"]:not([href="/perfil/editar"]), nav[aria-label="Navegação principal"] a[href^="/perfil/"]:not([href="/perfil/editar"])',
    )
    .first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/perfil\/[a-z0-9-]+$/);
  return href!.replace("/perfil/", "");
}

/**
 * Seleciona cidade → bairro no LocationPicker (usado em /publicar e /perfil/editar).
 * Bairro é opcional: passar `neighborhood` só quando a cidade tiver lista
 * (cidade sem curadoria mostra "Bairro não informado" — G6/P12).
 */
export async function chooseLocation(
  page: Page,
  city: string,
  uf: string,
  neighborhood?: string,
) {
  await page.getByLabel("Cidade").fill(city);
  await page.getByRole("button", { name: `${city} — ${uf}` }).click();
  await expect(page.getByRole("button", { name: `${city} — ${uf}` })).toHaveCount(0);

  if (neighborhood) {
    const select = page.getByLabel("Bairro");
    await expect(select).toBeVisible();
    await select.selectOption({ label: neighborhood });
  }
}

/** Cria uma publicação pelo formulário e devolve a URL da publicação. */
export async function publish(
  page: Page,
  options: {
    type?: "problem" | "idea";
    title: string;
    content: string;
    anonymous?: boolean;
    neighborhood?: string;
    photoPath?: string;
    city?: { name: string; uf: string };
  },
): Promise<string> {
  await page.goto("/publicar");

  if (options.type === "idea") {
    await page.getByRole("button", { name: "Ideia" }).click();
  }

  await page.getByLabel("Título").fill(options.title);
  await page.getByLabel("Texto").fill(options.content);

  if (options.photoPath) {
    await page.getByLabel(/Fotos/).setInputFiles(options.photoPath);
    await expect(page.getByText("imagem pronta")).toBeVisible();
  }

  // Cidade é obrigatória (V6); bairro é opcional fora da cidade de lançamento (P12).
  await chooseLocation(
    page,
    options.city?.name ?? "Cariacica",
    options.city?.uf ?? "ES",
    options.neighborhood,
  );

  if (options.anonymous) {
    await page.getByRole("checkbox", { name: /Publicar como anônimo/ }).check();
  }

  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/publicacao\/[0-9a-f-]+$/);
  return page.url();
}

/** Coleta erros de console/pageerror durante a navegação pelas rotas. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  return errors;
}
