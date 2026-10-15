import { redirect } from "next/navigation";

/** O hub `/amigos` tem a aba de solicitações (S4) — esta rota só redireciona. */
export default function FriendRequestsRedirectPage() {
  redirect("/amigos?tab=solicitacoes");
}
