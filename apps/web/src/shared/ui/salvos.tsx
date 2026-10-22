"use client";

import { Button } from "./button";

export function Saved() {
  return (
    <section>
      <div className="standard-head mb-5">
        <div className="flex items-center gap-4">
          <span className="eyebrow">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4Z"/>
            </svg>
            Só você vê
          </span>
        </div>
        <div className="screen-title mt-1 max-w-[440px]">Salvos para depois</div>
        <p className="mt-1 text-[10px] text-muted">Publicações guardadas para ler com calma.</p>
      </div>
      <div className="feed-list grid gap-4 md:gap-[14px] feed-list-narrow md:max-w-[720px]">
        <article className="rounded-[16px] border border-line bg-white p-5 pt-0 overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[42px] h-[42px] rounded-full bg-[#edf1f0] text-[#6d7f82] grid place-items-center font-extrabold text-[12px]">MA</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <b className="text-[12px] text-ink">Morador anônimo</b>
              </div>
              <span className="text-[9px] text-muted">Autor oculto · há 1 h</span>
            </div>
            <Button variant="ghost" size="sm" className="p-2" aria-label="Mais opções">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
              </svg>
            </Button>
          </div>
          <div className="flex items-center gap-4 md:gap-10 mb-4 text-muted text-[9px] font-semibold">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#966811]">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/>
              </svg>
              Ideia
            </span>
            <span className="flex items-center gap-4">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
              </svg>
              Itacibá
            </span>
          </div>
          <h3 className="text-[17px] font-extrabold text-ink leading-[1.35] tracking-[-.3px] mb-2">Horta comunitária no terreno ao lado da praça</h3>
          <p className="text-[11px] text-[#52686c] leading-[1.7] mb-4 whitespace-pre-line">O espaço está sem uso há anos. Poderíamos reunir moradores, escolas e comerciantes para criar uma horta e oficinas aos sábados.</p>
          <div className="flex justify-between text-muted text-[9px] pb-3 border-b border-line">
            <span><b className="text-ink">126</b> apoios</span>
            <span>27 comentários</span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-6 rounded-[7px] py-2 px-3 text-[10px] font-extrabold">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7 11 3 3 7-7"/>
              </svg>
              Apoiar
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-6 rounded-[7px] py-2 px-3 text-[10px] font-extrabold">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7 7 10 10M17 7 7 17"/>
              </svg>
              Opor-se
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-6 rounded-[7px] py-2 px-3 text-[10px] font-extrabold">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4 4h10a4 4 0 0 1 4 4Z"/>
              </svg>
              27
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto p-2 rounded-[7px]" title="Salvar para depois">
              <svg width={19} height={19} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h12v18l-6-4-6 4Z"/>
              </svg>
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
