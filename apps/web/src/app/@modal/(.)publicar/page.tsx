import { PublicationModal } from "@/shared/ui/publication-modal";
import { PublicationRouteContent } from "@/shared/ui/publication-route-content";

export const instant = false;

export default function InterceptedPublishPage() {
  return (
    <PublicationModal>
      <PublicationRouteContent />
    </PublicationModal>
  );
}
