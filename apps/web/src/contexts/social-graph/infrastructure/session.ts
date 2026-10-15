import type { CurrentSocialGraphSessionPort } from "@/contexts/social-graph/application/ports";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";

/** Porta de sessão do Social Graph (P3 — só contas confirmadas interagem). */
export const currentSocialGraphSession: CurrentSocialGraphSessionPort = async () => {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    return null;
  }

  return { userId: session.userId, emailConfirmed: session.emailConfirmed };
};
