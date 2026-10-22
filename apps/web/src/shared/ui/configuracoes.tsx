"use client";

import { useState } from "react";

import { Button } from "./button";
import { Eyebrow } from "./eyebrow";

export function Settings() {
  const [publicNeighborhood, setPublicNeighborhood] = useState(true);
  const [push, setPush] = useState(true);

  return (
    <section className="settings-page max-w-[760px]">
      <div className="standard-head mb-5">
        <div className="flex items-center gap-4">
          <Eyebrow light>INCLUÍDO · privacidade visível</Eyebrow>
        </div>
        <div className="screen-title mt-1 max-w-[440px]">Configurações</div>
        <p className="mt-1 text-[10px] text-muted">Gerencie sua experiência e seus dados.</p>
      </div>

      <div className="settings-card rounded-[14px] border border-line bg-white p-[6px_20px] mb-[12px]">
        <div className="settings-title pt-[15px] pb-[10px] text-[11px] font-extrabold">Privacidade do perfil</div>
        <div className="setting-row flex items-center gap-12 border-t border-line min-h-[70px]">
          <div className="setting-icon w-[35px] h-[35px] rounded-[9px] bg-soft text-brand grid place-items-center flex-0">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
            </svg>
          </div>
          <div className="flex-1">
            <b className="block text-[10px] text-ink">Mostrar meu bairro no perfil</b>
            <span className="block text-[8px] text-muted mt-[3px]">Sua cidade continuará pública.</span>
          </div>
          <Button className={`toggle w-[39px] h-[22px] border-0 rounded-[20px] p-3 cursor-pointer ${publicNeighborhood ? "bg-brand" : "bg-[#bdc9c8]"}`} onClick={() => setPublicNeighborhood(!publicNeighborhood)}>
            <i className={`w-[16px] h-[16px] rounded-full bg-white block transition-transform duration-200 ${publicNeighborhood ? "translate-x-[17px]" : ""}`} />
          </Button>
        </div>
        <div className="setting-row flex items-center gap-12 border-t border-line min-h-[70px]">
          <div className="setting-icon w-[35px] h-[35px] rounded-[9px] bg-soft text-brand grid place-items-center flex-0">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>
            </svg>
          </div>
          <div className="flex-1">
            <b className="block text-[10px] text-ink">Notificações em tempo real</b>
            <span className="block text-[8px] text-muted mt-[3px]">Comentários, reações e amizades.</span>
          </div>
          <Button className={`toggle w-[39px] h-[22px] border-0 rounded-[20px] p-3 cursor-pointer ${push ? "bg-brand" : "bg-[#bdc9c8]"}`} onClick={() => setPush(!push)}>
            <i className={`w-[16px] h-[16px] rounded-full bg-white block transition-transform duration-200 ${push ? "translate-x-[17px]" : ""}`} />
          </Button>
        </div>
        <div className="setting-row flex items-center gap-12 border-t border-line min-h-[70px]">
          <div className="setting-icon w-[35px] h-[35px] rounded-[9px] bg-soft text-brand grid place-items-center flex-0">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className="flex-1">
            <b className="block text-[10px] text-ink">Lista pública de amigos</b>
            <span className="block text-[8px] text-muted mt-[3px]">Outras pessoas podem ver suas conexões.</span>
          </div>
          <Button className="toggle w-[39px] h-[22px] border-0 rounded-[20px] p-3 cursor-pointer bg-brand" onClick={() => {}}>
            <i className="w-[16px] h-[16px] rounded-full bg-white block translate-x-[17px]" />
          </Button>
        </div>
      </div>

      <div className="settings-card rounded-[14px] border border-line bg-white p-[6px_20px] mb-[12px]">
        <div className="settings-title pt-[15px] pb-[10px] text-[11px] font-extrabold">Conta e segurança</div>
        {[["user", "Dados pessoais"], ["shield", "Pessoas bloqueadas"], ["lock", "Senha e acesso"]].map((r) => (
          <Button key={r[1]} className="settings-link w-full border-0 border-t border-line bg-white flex items-center gap-11 min-h-[52px] text-[10px] cursor-pointer px-0" onClick={() => {}}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {r[0] === "user" ? (<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>) : r[0] === "shield" ? (<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>) : (<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>)}
            </svg>
            <span className="flex-1 text-left">{r[1]}</span>
            <svg width={20} height={20} className="text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Button>
        ))}
      </div>

      <div className="danger-zone flex items-center justify-between gap-15 rounded-[8px] border border-[#efcbc8] bg-[#fff7f6] p-[18px_20px]">
        <div>
          <b className="block text-[10px] text-[#c94d45]">Encerrar minha conta</b>
          <p className="block text-[8px] text-muted mt-[3px]">Seus dados pessoais serão apagados e suas publicações serão anonimizadas.</p>
        </div>
        <Button className="border border-[#efcbc8] text-[#c94d45] bg-[#fff7f6] rounded-[8px] px-11 py-2 text-[9px] font-bold cursor-pointer">Encerrar conta</Button>
      </div>
    </section>
  );
}
