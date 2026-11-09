/**
 * setup-local.mjs — bootstrap do ambiente local em um comando.
 *
 * Uso:  npm run setup --prefix apps/web
 *        (ou: node apps/web/scripts/setup-local.mjs)
 *
 * O que faz, na ordem:
 *   1. confere que o Docker está rodando (a stack local roda em containers);
 *   2. confere que a CLI do Supabase está instalada;
 *   3. sobe a stack local (`supabase start` na raiz do repo) e aplica
 *      migrations + seeds via `db reset` quando o banco ainda não existe;
 *   4. lê `supabase status` e escreve `apps/web/.env.local` (gitignored) com
 *      as chaves da stack local;
 *   5. instala dependências npm se `node_modules` estiver ausente;
 *   6. imprime os próximos passos (app, Inbucket, Studio).
 *
 * O script é idempotente: rodar de novo em stack já ativa apenas regera o
 * `.env.local` (as chaves mudam quando a stack é recriada).
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const webDir = join(repoRoot, "apps", "web");
const envLocalPath = join(webDir, ".env.local");

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function info(message) {
  console.log(`${c.bold}==>${c.reset} ${message}`);
}

function success(message) {
  console.log(`${c.green}==> ${message}${c.reset}`);
}

function warn(message) {
  console.log(`${c.yellow}==> ${message}${c.reset}`);
}

function fail(message, hint) {
  console.error(`${c.red}==> ${message}${c.reset}`);
  if (hint) {
    console.error(`${c.dim}    ${hint}${c.reset}`);
  }
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: options.silent ? "pipe" : "inherit",
    encoding: "utf-8",
    // shell só é necessário para comandos .cmd no Windows (npx/npm); nesses casos
    // os argumentos não contêm espaços. Para docker/supabase o shell é false,
    // porque com shell true o Windows quebraria argumentos com espaço (ex.: SQL).
    shell: options.shell ?? false,
  });

  if (result.error) {
    fail(
      `não foi possível executar \`${command} ${args.join(" ")}\`: ${result.error.message}`,
      options.hint,
    );
  }

  return result;
}

// ---------------------------------------------------------------- 1. Docker
info("Conferindo o Docker...");
const docker = run("docker", ["info"], { silent: true });
if (docker.status !== 0) {
  fail(
    "o Docker não está respondendo.",
    "Abra o Docker Desktop e aguarde o engine iniciar; depois rode este script de novo.",
  );
}
success("Docker respondendo.");

// ---------------------------------------------------------------- 2. CLI Supabase
// A CLI pode estar no PATH (`scoop install supabase`) ou ser resolvida via npx.
// Detectamos uma vez e reutilizamos o comando completo em todas as chamadas.
function resolveSupabaseCli() {
  const onPath = spawnSync("supabase", ["--version"], {
    encoding: "utf-8",
    shell: false,
  });
  if (onPath.status === 0) {
    return { command: "supabase", prefix: [], shell: false };
  }
  const viaNpx = spawnSync("npx", ["--yes", "supabase", "--version"], {
    encoding: "utf-8",
    shell: process.platform === "win32",
  });
  if (viaNpx.status === 0) {
    return {
      command: "npx",
      prefix: ["--yes", "supabase"],
      shell: process.platform === "win32",
    };
  }
  return null;
}

info("Conferindo a CLI do Supabase...");
const supabaseCli = resolveSupabaseCli();
if (!supabaseCli) {
  fail(
    "a CLI do Supabase não foi encontrada.",
    "Instale com:  scoop install supabase   (ou veja https://supabase.com/docs/guides/cli)",
  );
}

function supabase(args, options = {}) {
  return run(supabaseCli.command, [...supabaseCli.prefix, ...args], {
    ...options,
    shell: supabaseCli.shell,
  });
}

// ---------------------------------------------------------------- 3. Stack local
const alreadyRunning = supabase(["status"], { silent: true }).status === 0;
if (alreadyRunning) {
  success("Stack local já está rodando.");
} else {
  info("Subindo a stack local (Postgres, Auth, Storage, Realtime, Studio, Inbucket)...");
  info("A primeira execução baixa as imagens — pode levar alguns minutos.");
  const started = supabase(["start"], { silent: true });
  if (started.status !== 0) {
    fail(
      "`supabase start` falhou.",
      "Rode `supabase start` manualmente na raiz do repo para ver o erro completo.",
    );
  }
  success("Stack local no ar.");
}

// Banco recém-criado precisa de migrations + seeds. `db reset` é idempotente
// e só necessário quando as tabelas ainda não existem — mas é inofensivo
// (apaga e recria o banco LOCAL), então perguntamos antes.
const dbReady = run(
  "docker",
  [
    "exec",
    "supabase_db_minha-cidade",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-tAc",
    "select 1 from information_schema.tables where table_schema = 'identity' limit 1",
  ],
  { silent: true },
);

if (dbReady.status !== 0 || dbReady.stdout.trim() !== "1") {
  info("Aplicando migrations e seeds (`supabase db reset`)...");
  const reset = supabase(["db", "reset"], { silent: true });
  if (reset.status !== 0) {
    fail(
      "`supabase db reset` falhou.",
      "Rode `supabase db reset` manualmente na raiz do repo para ver o erro completo.",
    );
  }
  success("Migrations e seeds aplicados.");
} else {
  success("Banco local já migrado.");
}

// ---------------------------------------------------------------- 4. .env.local
info("Gerando apps/web/.env.local com as chaves da stack local...");
const status = supabase(["status"], { silent: true });
if (status.status !== 0) {
  fail("não foi possível ler `supabase status`.");
}

// As chaves aparecem em formatos diferentes conforme a versão da CLI:
//   - CLI nova (2.x atual): tabela com "│ Publishable │ sb_publishable_... │"
//     e "│ Secret │ sb_secret_... │";
//   - CLI antiga: linhas "anon key: eyJ..." e "service_role key: eyJ...".
// Os dois formatos são aceitos pela stack local (testado: REST, login e admin).
const parseTableValue = (label) => {
  const line = status.stdout
    .split(/\r?\n/)
    .find((row) => row.includes("│") && row.includes(label));
  if (!line) return "";
  const cell = line.split("│")[2];
  return cell ? cell.trim() : "";
};

const parse = (pattern) => {
  const line = status.stdout
    .split(/\r?\n/)
    .find((row) => pattern.test(row.trim()));
  if (!line) return "";
  const colon = line.indexOf(":");
  return colon === -1 ? "" : line.slice(colon + 1).trim();
};

// CLI mais recente: `supabase status` imprime um objeto JSON (API_URL, DB_URL,
// PUBLISHABLE_KEY, SECRET_KEY, ANON_KEY, SERVICE_ROLE_KEY).
const statusJson = (() => {
  const start = status.stdout.indexOf("{");
  const end = status.stdout.lastIndexOf("}");
  if (start === -1 || end <= start) return {};
  try {
    return JSON.parse(status.stdout.slice(start, end + 1));
  } catch {
    return {};
  }
})();

const apiUrl =
  statusJson.API_URL ||
  parseTableValue("Project URL") ||
  parse(/^API URL:/i) ||
  "http://127.0.0.1:54321";
const dbUrl =
  statusJson.DB_URL ||
  status.stdout
    .split(/\r?\n/)
    .filter((row) => row.includes("postgresql://"))
    .map((row) => {
      const cell = row.split("│")[2];
      return cell ? cell.trim() : "";
    })
    .find((value) => value.startsWith("postgresql://")) ||
  parse(/^DB URL:/i) ||
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const anonKey =
  statusJson.PUBLISHABLE_KEY ||
  statusJson.ANON_KEY ||
  parseTableValue("Publishable") ||
  parse(/^anon key:/i) ||
  "";
const serviceRoleKey =
  statusJson.SECRET_KEY ||
  statusJson.SERVICE_ROLE_KEY ||
  parseTableValue("Secret") ||
  parse(/^service_role key:/i) ||
  "";

if (!anonKey || !serviceRoleKey) {
  fail(
    "não foi possível extrair anon/service_role key de `supabase status`.",
    "Rode `supabase status` e copie as chaves manualmente para apps/web/.env.local.",
  );
}

const envContent = `# Gerado por scripts/setup-local.mjs — NÃO versionar (gitignored).
# Stack local do Supabase; as chaves mudam quando a stack é recriada.
# Conforme a versão da CLI, os valores são as chaves novas (sb_publishable_/sb_secret_)
# ou as legadas (JWT anon/service_role) — ambas funcionam na stack local.

NEXT_PUBLIC_SUPABASE_URL=${apiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=${dbUrl}
`;

mkdirSync(webDir, { recursive: true });
writeFileSync(envLocalPath, envContent, "utf-8");
success(`apps/web/.env.local escrito (${envLocalPath}).`);

// ---------------------------------------------------------------- 5. Dependências
if (!existsSync(join(webDir, "node_modules"))) {
  info("Instalando dependências do app (primeira vez)...");
  const installed = run("npm", ["install"], {
    cwd: webDir,
    shell: process.platform === "win32",
  });
  if (installed.status !== 0) {
    fail("`npm install` falhou — veja o erro acima.");
  }
  success("Dependências instaladas.");
} else {
  success("Dependências já instaladas.");
}

// ---------------------------------------------------------------- 6. Próximos passos
console.log("");
console.log(`${c.bold}Ambiente local pronto.${c.reset}`);
console.log("");
console.log(`  App:          ${c.bold}npm run dev --prefix apps/web${c.reset}  → http://localhost:3000`);
console.log(`  Inbucket:     http://127.0.0.1:54324  (e-mails de confirmação de cadastro)`);
console.log(`  Studio:       http://127.0.0.1:54323  (inspecionar o banco)`);
console.log("");
console.log(`  ${c.dim}Usuários de teste (senha Cidade@123): ana@minhacidade.dev,`);
console.log(`  bruno@minhacidade.dev, carla@minhacidade.dev (admin), daniel@minhacidade.dev${c.reset}`);
console.log("");
warn("Problemas conhecidos: docs \"Como rodar\" do README.");
