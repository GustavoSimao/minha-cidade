import type { Metadata } from "next";

import { PublicationModal } from "@/shared/ui/publication-modal";
import { PublicationRouteContent } from "@/shared/ui/publication-route-content";

export const metadata: Metadata = { title: "Publicar" };

// Página protegida: depende da sessão (P3 — publicar exige conta com e-mail confirmado).
export const instant = false;

export default function PublishPage() {
  return (
    <PublicationModal>
      <PublicationRouteContent />
    </PublicationModal>
  );
}
