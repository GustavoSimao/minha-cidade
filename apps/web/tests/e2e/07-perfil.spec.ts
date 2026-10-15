import { expect, test } from "@playwright/test";

import { myUsername, signUpFreshUser } from "./helpers";

/**
 * Perfil (Fase 2/I2–I7): editar cidade/bairro reflete no perfil público;
 * username é imutável e o link "Meu perfil" descobre o username logado.
 */
test("editar cidade e bairro atualiza o perfil público", async ({ page, request }) => {
  await signUpFreshUser(page, request);
  const username = await myUsername(page);

  await page.goto("/perfil/editar");
  await page.getByLabel("Cidade").fill("Cariacica");
  await page.getByRole("button", { name: "Cariacica — ES" }).click();
  await page.getByLabel("Bairro").selectOption({ label: "Alto Lage" });
  await page.getByLabel("Bio").fill("Bio de teste e2e para verificar o perfil publico.");
  await page.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();

  await page.goto(`/perfil/${username}`);
  await expect(page.getByText("Bio de teste e2e para verificar o perfil publico.")).toBeVisible();
  await expect(page.getByText("Cariacica — Alto Lage")).toBeVisible();
});

test("perfil público não expõe e-mail nem telefone (I7)", async ({ page }) => {
  await page.goto("/perfil/ana-souza");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ana Souza");
  await expect(page.getByText("ana@minhacidade.dev")).toHaveCount(0);
  await expect(page.getByText("(27) 99911-2222")).toHaveCount(0);
  await expect(page.getByText("@ana-souza")).toBeVisible();
});

test("perfil mostra publicações do autor", async ({ page }) => {
  await page.goto("/perfil/carla-dias");
  await expect(page.getByRole("heading", { name: /Mutirão de limpeza do córrego/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Publicações", exact: true })).toBeVisible();
  await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
});

test("subir foto de perfil aparece no perfil público (T2)", async ({ page, request }) => {
  await signUpFreshUser(page, request);
  const username = await myUsername(page);

  await page.goto("/perfil/editar");
  await page.getByLabel(/Foto de perfil/).setInputFiles("tests/e2e/fixtures/foto.png");

  // O upload grava o path no input oculto e a prévia aponta para o Storage.
  const avatarPath = page.locator('input[name="avatarPath"]');
  await expect(avatarPath).toHaveValue(/^[0-9a-f-]+\/[0-9a-f-]+\.webp$/, { timeout: 15_000 });

  await page.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();

  await page.goto(`/perfil/${username}`);
  // `next/image` reescreve o src para /_next/image?url=<url codificada>.
  await expect(page.getByRole("img", { name: /^Foto de/ }).first()).toHaveAttribute(
    "src",
    /%2Fstorage%2Fv1%2Fobject%2Fpublic%2Favatars%2F[0-9a-f-]+%2F[0-9a-f-]+\.webp/,
  );
});

test("desligar a exibição do bairro omite só o bairro no perfil (I7)", async ({ page, request }) => {
  await signUpFreshUser(page, request);
  const username = await myUsername(page);

  await page.goto("/perfil/editar");
  await page.getByLabel("Cidade").fill("Cariacica");
  await page.getByRole("button", { name: "Cariacica — ES" }).click();
  await page.getByLabel("Bairro").selectOption({ label: "Alto Lage" });
  await page.getByRole("checkbox", { name: /Mostrar onde eu moro/ }).uncheck();
  await page.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.getByText("Perfil atualizado")).toBeVisible();

  await page.goto(`/perfil/${username}`);
  await expect(page.getByText("Cariacica", { exact: false })).toBeVisible();
  await expect(page.getByText("Alto Lage")).toHaveCount(0);
});
