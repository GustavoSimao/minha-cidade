"use client";

import { Button } from "./button";
import { Eyebrow } from "./eyebrow";

export function Transparency() {
  const metrics = [
    ["1.248", "publicações", "↑ 12% no mês"],
    ["8.614", "participações", "↑ 18% no mês"],
    ["186", "temas resolvidos", "↑ 24 no mês"],
    ["42", "ações moderadas", "3,4% do total"],
  ];
  const bairros = [
    ["Campo Grande", "248"],
    ["Itacibá", "196"],
    ["Alto Lage", "164"],
    ["Jardim América", "141"],
    ["Porto de Santana", "98"],
  ];
  const bars = [38, 55, 46, 72, 61, 84, 68, 92, 78, 98, 86, 112];

  return (
    <section>
      <div className="transparency-hero rounded-[18px] bg-brand p-[32px] flex items-center justify-between text-white overflow-hidden relative mb-4">
        <div>
          <Eyebrow light>Dados abertos à comunidade</Eyebrow>
          <div className="screen-title mt-1 text-white max-w-[440px]">Transparência em Cariacica</div>
          <p className="mt-1 text-[10px] opacity-75">Um retrato agregado da participação cívica, sem expor dados pessoais.</p>
        </div>
        <Button className="z-1 border border-white/30 text-white bg-white/10 rounded-[9px] h-[40px] px-14 items-center gap-7 text-[10px] font-extrabold cursor-pointer hover:bg-white/20">
          Baixar relatório
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 14 0m-5-5 5 5-5 5"/>
          </svg>
        </Button>
      </div>

      <div className="metric-grid grid grid-cols-4 gap-12 mb-4">
        {metrics.map((m) => (
          <div key={m[1]} className="rounded-[13px] border border-line bg-white p-[18px]">
            <span className="block text-[9px] text-muted">{m[1]}</span>
            <b className="block text-[24px] text-ink mt-[7px]">{m[0]}</b>
            <small className="block text-[8px] text-brand">{m[2]}</small>
          </div>
        ))}
      </div>

      <div className="data-grid grid grid-cols-[1.5fr_1fr] gap-14">
        <div className="rounded-[16px] border border-line bg-white p-[25px] min-w-0">
          <div className="flex items-center justify-between mb-[13px]">
            <span className="text-[11px] font-extrabold text-ink">Participação por semana</span>
            <Button variant="ghost" size="sm" className="text-brand text-[9px] font-extrabold cursor-pointer">Últimos 3 meses⌄</Button>
          </div>
          <div className="bars h-[145px] flex items-end justify-between gap-7 border-b border-line pt-[10px]">
            {bars.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <i className="w-full max-w-[20px] rounded-t-[3px] bg-brand-pale border-t-2 border-brand block" style={{ height: `${v}px` }} />
                <span className={`block text-[7px] text-muted h-[17px] pt-4 ${i % 3 === 0 ? "" : ""}`}>{i % 3 === 0 ? `S${i + 1}` : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-line bg-white p-[25px]">
          <div className="flex items-center justify-between mb-[13px]">
            <span className="text-[11px] font-extrabold text-ink">Bairros mais ativos</span>
            <Button variant="ghost" size="sm" className="text-brand text-[9px] font-extrabold cursor-pointer">Ver todos</Button>
          </div>
          {bairros.map((r, i) => (
            <div key={r[0]} className="ranking h-[42px] flex items-center gap-10 border-t border-line text-[9px]">
              <b className="w-[22px] h-[22px] grid place-items-center bg-soft rounded-full text-brand">{i + 1}</b>
              <span className="flex-1 font-bold">{r[0]}</span>
              <small className="text-muted text-[8px]">{r[1]} publicações</small>
            </div>
          ))}
        </div>
      </div>

      <div className="privacy-note mt-[14px] rounded-[12px] bg-brand-pale text-brand p-4 md:p-[16px_20px] flex gap-12 items-center">
        <svg width={24} height={24} className="text-brand flex-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 10V7a4 4 0 0 1 8 0v3"/>
          <rect x="5" y="10" width="14" height="11" rx="2"/>
        </svg>
        <div>
          <b className="block text-[10px]">Privacidade por design</b>
          <p className="block text-[9px] text-muted mt-[3px]">Os dados desta página são agregados. Identidades, salvamentos e informações privadas nunca aparecem aqui.</p>
        </div>
      </div>
    </section>
  );
}
