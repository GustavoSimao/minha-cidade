"use client";

import { useState } from "react";

import { Button } from "./button";

export function Notifications() {
  const [read, setRead] = useState<number[]>([]);
  const items = [
    { icon: "comment", title: "Lucas comentou na sua publicação", text: "“Também notei isso ontem. Precisamos sinalizar...”", time: "há 8 min" },
    { icon: "support", title: "12 pessoas apoiaram sua ideia", text: "Horta comunitária no terreno ao lado da praça", time: "há 41 min" },
    { icon: "users", title: "Beatriz aceitou seu pedido de amizade", text: "Agora vocês fazem parte da rede um do outro.", time: "há 2 h" },
    { icon: "bell", title: "Prefeitura de Cariacica respondeu", text: "A solicitação foi encaminhada à equipe responsável.", time: "ontem" },
  ];

  return (
    <section className="section-card rounded-[16px] border border-line bg-white p-[25px] md:p-[25px]">
      <div className="section-heading flex items-center justify-between gap-4 md:gap-20 mb-4">
        <div>
          <div className="flex items-center gap-4">
            <span className="eyebrow">Sua comunidade</span>
          </div>
          <div className="screen-title mt-1">Notificações</div>
        </div>
        <Button onClick={() => setRead([0, 1, 2, 3])} variant="ghost" size="sm" className="text-brand text-[10px] font-extrabold cursor-pointer">
          Marcar todas como lidas
        </Button>
      </div>
      <div className="notification-tabs flex gap-4 md:gap-7 flex-wrap mt-[24px] mb-[12px]">
        <Button variant="ghost" size="sm" className="min-h-[34px] rounded-[20px] border border-brand bg-brand-pale px-4 text-[10px] font-extrabold text-brand">Todas</Button>
        <Button variant="ghost" size="sm" className="min-h-[34px] rounded-[20px] border border-line bg-white px-4 text-[10px] font-extrabold text-muted">Interações</Button>
        <Button variant="ghost" size="sm" className="min-h-[34px] rounded-[20px] border border-line bg-white px-4 text-[10px] font-extrabold text-muted">Amizades</Button>
      </div>
      <div className="notification-list border-t border-line">
        {items.map((item, index) => (
          <Button
            key={item.title}
            className={`notification w-full rounded-[12px] border-0 bg-[#f8fbfa] flex text-left gap-4 md:gap-14 p-3 md:p-[18px_12px] cursor-pointer relative ${read.includes(index) ? "read" : ""}`}
            onClick={() => setRead([...read, index])}
          >
            <div className="notification-icon mt-1 text-brand">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {item.icon === "comment" ? (<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>) : item.icon === "support" ? (<path d="m7 11 3 3 7-7"/>) : item.icon === "users" ? (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>) : (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>)}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <b className="block text-[11px] text-ink">{item.title}</b>
              <p className="block text-[10px] text-muted mt-1">{item.text}</p>
            </div>
            <span className="block text-[8px] text-muted">{item.time}</span>
            {!read.includes(index) && <i className="absolute right-[12px] top-[24px] w-[7px] h-[7px] bg-[#f06b54] rounded-full" />}
          </Button>
        ))}
      </div>
    </section>
  );
}
