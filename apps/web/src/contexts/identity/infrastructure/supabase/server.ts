// Cliente Supabase compartilhado entre contextos (infraestrutura comum, não é
// domínio). A implementação vive em `@/shared/infrastructure/supabase`; este
// módulo permanece como ponto de importação histórico do contexto Identity.
export { createClient, createServiceRoleClient } from "@/shared/infrastructure/supabase";
