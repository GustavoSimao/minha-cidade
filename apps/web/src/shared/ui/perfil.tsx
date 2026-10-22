"use client";

import { Button } from "./button";
import Image from "next/image";

export function Profile() {
  return (
    <section className="profile-page rounded-[17px] border border-line bg-white overflow-hidden">
      <div className="cover h-[190px]">
        <Image src="https://images.unsplash.com/photo-1572894234976-d961418c709d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" alt="Capa do perfil" className="h-full w-full object-cover brightness-80" width={1080} height={360} unoptimized />
      </div>
      <div className="profile-main p-5 md:p-[0_30px_20px] relative">
        <div className="profile-avatar w-[100px] h-[100px] border-5 border-white rounded-full bg-gradient-to-br from-[#247e82] to-[#093f43] text-white grid place-items-center font-extrabold text-[25px] mt-[-50px] mb-[12px] flex-0 flex-none">AS</div>
        <Button className="outline-button absolute right-[28px] top-18 border border-brand text-brand bg-white rounded-[9px] h-[38px] px-14 text-[10px] font-extrabold cursor-pointer">Editar perfil</Button>
        <div className="screen-title mt-1">Ana Santos</div>
        <span className="handle block text-[10px] text-muted">@anasan</span>
        <p className="max-w-[520px] md:max-w-[520px] text-[10px] text-muted leading-[1.6] mt-1">Moradora de Cariacica, mãe, arquiteta e apaixonada por cidades feitas para pessoas.</p>
        <div className="profile-meta flex gap-4 md:gap-[20px] text-[9px] text-muted mt-3">
          <span className="flex items-center gap-5"><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> Campo Grande, Cariacica</span>
          <span className="flex items-center gap-5"><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> <b>128</b> amigos</span>
        </div>
      </div>
      <div className="profile-tabs flex gap-4 md:gap-[25px] px-5 md:px-[30px] border-t border-line border-b border-line overflow-x-auto whitespace-nowrap">
        <Button variant="secondary" size="sm" className="border-0 bg-transparent text-[10px] font-bold border-b-2 border-brand pb-2">Publicações <span className="bg-soft rounded-[10px] px-2 py-0.5 text-[9px] font-bold">12</span></Button>
        <Button variant="ghost" size="sm" className="border-0 bg-transparent text-[10px] font-bold text-muted border-b-2 border-transparent pb-2">Ideias apoiadas</Button>
        <Button variant="ghost" size="sm" className="border-0 bg-transparent text-[10px] font-bold text-muted border-b-2 border-transparent pb-2">Amigos <span className="bg-soft rounded-[10px] px-2 py-0.5 text-[9px] font-bold">128</span></Button>
      </div>
      <div className="feed-list grid gap-4 md:gap-[14px] p-4 md:p-[18px] bg-soft">
        <article className="rounded-[16px] border border-line bg-white p-5 pt-0 overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[42px] h-[42px] rounded-full bg-brand-pale text-brand grid place-items-center font-extrabold text-[12px]">MS</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <b className="text-[12px] text-ink">Marina Souza</b>
                <span className="w-[15px] h-[15px] grid place-items-center bg-brand text-white rounded-full"><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></span>
              </div>
              <span className="text-[9px] text-muted">@marinasouza · há 32 min</span>
            </div>
            <Button variant="ghost" size="sm" className="p-2" aria-label="Mais opções">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
              </svg>
            </Button>
          </div>
          <div className="flex items-center gap-4 md:gap-10 mb-4 text-muted text-[9px] font-semibold">
            <span className="inline-flex items-center gap-2 rounded-[6px] bg-[#fff0ec] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.4px] text-danger">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/>
              </svg>
              Problema
            </span>
            <span className="flex items-center gap-4">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
              </svg>
              Campo Grande
            </span>
          </div>
          <h3 className="text-[17px] font-extrabold text-ink leading-[1.35] tracking-[-.3px] mb-2">Faixa de pedestres apagada perto da escola</h3>
          <p className="text-[11px] text-[#52686c] leading-[1.7] mb-4 whitespace-pre-line">Na Av. Expedito Garcia, em frente à escola, a faixa está quase invisível. Nos horários de entrada e saída fica perigoso para as crianças.</p>
          <div className="flex justify-between text-muted text-[9px] pb-3 border-b border-line">
            <span><b className="text-ink">84</b> apoios</span>
            <span>12 comentários</span>
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
              12
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto p-2 rounded-[7px]" title="Salvar para depois">
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h12v18l-6-4-6 4Z"/>
              </svg>
            </Button>
          </div>
        </article>
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
            <span className="inline-flex items-center gap-2 rounded-[6px] bg-[#fff6de] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.4px] text-[#966811]">
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
              <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h12v18l-6-4-6 4Z"/>
              </svg>
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
