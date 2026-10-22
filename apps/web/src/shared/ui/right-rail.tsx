import Link from "next/link";

import { Icon } from "./icon";

export function RightRail() {
  return (
    <aside aria-label="Mais informações" className="flex w-[300px] flex-col gap-4">
      <section className="border-b border-line px-5 pb-5">
        <span className="eyebrow">Participação local</span>
        <h2 className="mt-2 font-display text-xl font-bold text-ink">
          Acompanhe sua comunidade
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Veja como funcionam a moderação, as políticas e os dados públicos do Minha Cidade.
        </p>
        <Link
          className="mt-4 inline-flex min-h-11 items-center gap-2 bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          href="/transparencia"
        >
          Transparência
          <Icon name="arrow" size={16} />
        </Link>
      </section>

      <nav aria-label="Links da comunidade" className="px-5 pt-5">
        <h2 className="font-semibold text-ink">Comunidade</h2>
        <ul className="mt-3 flex flex-col gap-1">
          <li>
            <Link className="flex min-h-11 items-center gap-3 rounded-button px-2 text-sm text-ink hover:bg-soft" href="/amigos">
              <Icon name="users" size={18} />
              Amizades
            </Link>
          </li>
          <li>
            <Link className="flex min-h-11 items-center gap-3 rounded-button px-2 text-sm text-ink hover:bg-soft" href="/termos">
              <Icon name="shield" size={18} />
              Termos e regras
            </Link>
          </li>
          <li>
            <Link className="flex min-h-11 items-center gap-3 rounded-button px-2 text-sm text-ink hover:bg-soft" href="/privacidade">
              <Icon name="lock" size={18} />
              Privacidade
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
