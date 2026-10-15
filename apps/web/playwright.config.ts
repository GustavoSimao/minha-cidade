import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração dos testes e2e (Fase 9 do plano).
 *
 * Pré-requisito: stack local no ar com seed fresco —
 *   npm run setup --prefix apps/web   (supabase start + db reset + .env.local)
 *
 * - Sem paralelismo: os testes compartilham o mesmo banco local e alguns
 *   criam/alteram estado (denúncias, moderação); rodar em série mantém o
 *   resultado determinístico.
 * - Dois projetos: mobile 375x667 e desktop 1280x720 (viewports do README).
 *   Rodar só um:  npx playwright test --project=mobile
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["line"]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 667 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
