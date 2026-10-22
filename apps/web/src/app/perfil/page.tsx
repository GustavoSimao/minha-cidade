import { redirect } from "next/navigation";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";

export const instant = false;

export default async function OwnProfilePage() {
  const session = await new SupabaseAuthGateway().currentSession();
  if (!session) redirect("/login?next=/perfil");

  const profile = await new SupabaseProfileRepository().findById(session.userId);
  if (!profile) redirect("/perfil/editar");

  redirect(`/perfil/${profile.username.value}`);
}
