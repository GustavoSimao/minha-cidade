import Link from "next/link";

import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/public-url";
import { FriendButton } from "@/shared/ui/social-graph/friend-button";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";

export interface PersonRowPerson {
  username: string;
  fullName: string;
  avatarPath: string | null;
  isVerified: boolean;
  verifiedOrg: string | null;
}

export interface PersonRowProps {
  person: PersonRowPerson;
  relationship: "none" | "pending_sent" | "pending_received" | "friends";
  canInteract: boolean;
  /** Contexto de onde veio a sugestão (bairro, cidade…) — linha fina sob o @. */
  subtitle?: string;
}

/** Cartão de pessoa usado pelas abas do hub e pela descoberta (S3/S4). */
export function PersonRow({ person, relationship, canInteract, subtitle }: PersonRowProps) {
  return (
    <li
      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-subtle bg-surface-raised p-4"
      key={person.username}
    >
      <Link className="flex items-center gap-3" href={`/perfil/${person.username}`}>
        <Avatar
          imageUrl={person.avatarPath ? publicStorageUrl("avatars", person.avatarPath) : null}
          name={person.fullName}
          size={40}
        />
        <span>
          <span className="flex flex-wrap items-center gap-2 font-semibold text-text-strong">
            {person.fullName}
            {person.isVerified && person.verifiedOrg ? (
              <Badge testId="institutional-badge" tone="institutional">
                {person.verifiedOrg}
              </Badge>
            ) : null}
          </span>
          <span className="block text-sm text-text-muted">
            @{person.username}
            {subtitle ? ` · ${subtitle}` : ""}
          </span>
        </span>
      </Link>
      <FriendButton canInteract={canInteract} relationship={relationship} username={person.username} />
    </li>
  );
}
