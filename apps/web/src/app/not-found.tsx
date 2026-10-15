import Link from "next/link";

import { EmptyState } from "@/shared/ui/empty-state";
import { InboxIcon } from "@/shared/ui/icon";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-12">
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
            href="/"
          >
            Voltar ao feed
          </Link>
        }
        description="O endereço acessado não existe ou o conteúdo foi removido."
        icon={<InboxIcon className="h-8 w-8" />}
        title="Página não encontrada"
      />
    </div>
  );
}
