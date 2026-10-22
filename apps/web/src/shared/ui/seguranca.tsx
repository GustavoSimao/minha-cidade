"use client";

import { Eyebrow } from "./eyebrow";

const additions = [
  ["Busca e mapa territorial", "Inspirado em Colab e Citizen: encontrar temas por proximidade."],
  ["Central de segurança", "Inspirado em Nextdoor: regras, denúncias e bloqueios em um só lugar."],
  ["Onboarding de território", "Cidade e bairro definidos antes do feed para relevância desde o início."],
  ["Preferências de privacidade", "Controle claro sobre bairro público, notificações e conta."],
];

export function Safety() {
  return (
    <section>
      <div className="standard-head mb-5">
        <div className="flex items-center gap-4">
          <Eyebrow>Confiança comunitária</Eyebrow>
        </div>
        <div className="screen-title mt-1 max-w-[440px]">Segurança e regras</div>
        <p className="mt-1 text-[10px] text-muted">Entenda como mantemos conversas locais úteis, respeitosas e privadas.</p>
      </div>
      <div className="safety-grid grid grid-cols-3 gap-12">
        {[
          { icon: "shield", title: "Denúncias não derrubam conteúdo automaticamente", body: "Com 3 denúncias, o conteúdo entra na fila. Moderadores podem ocultar de forma reversível; só administradores removem definitivamente." },
          { icon: "lock", title: "Seu anonimato é protegido", body: "Quando você publica anonimamente, sua identidade nunca aparece na leitura pública. Salvamentos também são sempre privados." },
          { icon: "users", title: "Moderação com responsabilidade", body: "Ações são registradas, reversíveis e acompanhadas por métricas agregadas na página de transparência." },
        ].map((s) => (
          <div key={s.title} className="rounded-[14px] border border-line bg-white p-[20px] safety-card">
            <svg width={24} height={24} className="text-brand flex-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {s.icon === "shield" ? (<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>) : s.icon === "lock" ? (<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>) : (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>)}
            </svg>
            <b className="block text-[11px] text-ink mt-[13px] mb-[6px] leading-[1.45]">{s.title}</b>
            <p className="block text-[9px] text-muted leading-[1.65]">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="comparison rounded-[16px] border border-line bg-white mt-[15px] p-[24px]">
        <div className="flex items-center justify-between gap-20 mb-4">
          <div>
            <div className="flex items-center gap-4">
              <Eyebrow>Comparativo de mercado</Eyebrow>
            </div>
            <div className="screen-title small mt-1 text-brand">Telas adicionais identificadas</div>
          </div>
          <span className="included-badge rounded-[20px] bg-brand-pale text-brand px-10 py-[6px] text-[8px] font-extrabold tracking-[1px]">INCLUÍDAS</span>
        </div>
        {additions.map((a, i) => (
          <div key={a[0]} className="addition flex items-center gap-15 py-[16px] px-[4px] border-t border-line first:mt-[16px] first:border-0">
            <span className="text-[#a9baba] text-[14px] font-extrabold">0{i + 1}</span>
            <div className="flex-1">
              <b className="block text-[11px] text-ink">{a[0]}</b>
              <p className="block text-[9px] text-muted mt-[3px]">{a[1]}</p>
            </div>
            <svg width={20} height={20} className="text-brand flex-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6"/>
            </svg>
          </div>
        ))}
      </div>
    </section>
  );
}
