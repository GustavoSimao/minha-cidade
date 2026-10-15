import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

/**
 * Layout responsivo (B7): barra inferior no mobile, navegação completa no
 * desktop. Roda nos dois projetos (mobile 375 / desktop 1280) e pula o
 * projeto que não corresponde ao viewport.
 */
test("navegação principal se adapta ao viewport", async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name === "mobile";
  await signIn(page, "ana@minhacidade.dev");
  await page.goto("/");

  const bottomNav = page.getByRole("navigation", { name: "Navegação principal" });

  if (isMobile) {
    // Barra inferior fixa (B7).
    await expect(bottomNav).toBeVisible();
    // Links do cabeçalho ficam ocultos no mobile.
    await expect(page.getByRole("link", { name: "Amizades" })).toBeHidden();
  } else {
    // Cabeçalho completo.
    await expect(bottomNav).toBeHidden();
    await expect(page.getByRole("link", { name: "Feed" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Amizades" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Salvos" })).toBeVisible();
  }
});

test("formulário de publicar é usável no viewport", async ({ page }) => {
  await signIn(page, "ana@minhacidade.dev");
  await page.goto("/publicar");
  await expect(page.getByLabel("Título")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar" })).toBeVisible();

  // Sem rolagem horizontal.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
