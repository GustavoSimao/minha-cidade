"use client";

import { useState } from "react";
import { Button } from "./button";
import { PostCard } from "./post-card";
import { Eyebrow } from "./eyebrow";

const photos = {
  city: "https://images.unsplash.com/photo-1572894234976-d961418c709d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  street: "https://images.unsplash.com/photo-1712007449695-e20435550a2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  road: "https://images.unsplash.com/photo-1784548789954-655c9a9e1a64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

const posts = [
  {
    id: 1,
    type: "Problema" as const,
    author: "Marina Souza",
    handle: "@marinasouza",
    time: "há 32 min",
    neighborhood: "Campo Grande",
    title: "Faixa de pedestres apagada perto da escola",
    body: "Na Av. Expedito Garcia, em frente à escola, a faixa está quase invisível. Nos horários de entrada e saída fica perigoso para as crianças.",
    image: photos.street,
    support: 84,
    oppose: 3,
    comments: 12,
    avatar: "MS",
    verified: true,
  },
  {
    id: 2,
    type: "Ideia" as const,
    author: "Morador anônimo",
    handle: "Autor oculto",
    time: "há 1 h",
    neighborhood: "Itacibá",
    title: "Horta comunitária no terreno ao lado da praça",
    body: "O espaço está sem uso há anos. Poderíamos reunir moradores, escolas e comerciantes para criar uma horta e oficinas aos sábados.",
    support: 126,
    oppose: 8,
    comments: 27,
    avatar: "MA",
  },
  {
    id: 3,
    type: "Problema" as const,
    author: "João Ribeiro",
    handle: "@joaoribeiro",
    time: "há 3 h",
    neighborhood: "Alto Lage",
    title: "Buraco aumentando depois das últimas chuvas",
    body: "Já ocupa boa parte da rua e os carros precisam desviar pela contramão. Fica próximo ao ponto de ônibus.",
    image: photos.road,
    support: 57,
    oppose: 2,
    comments: 9,
    avatar: "JR",
  },
];

interface FilterChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function FilterChip({ children, active = false, onClick }: FilterChipProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`min-h-[34px] px-4 rounded-[20px] border border-line bg-white text-[10px] font-extrabold cursor-pointer ${active ? "text-brand border-brand/60 bg-brand-pale" : "text-muted"}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function Feed({ openComposer }: { openComposer: () => void }) {
  const [tab, setTab] = useState("Para você");

  return (
    <>
      <section className="mb-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <Eyebrow>Bom dia, Ana</Eyebrow>
            <div className="hero-title mt-1 max-w-[440px]">O que está acontecendo perto de você?</div>
          </div>
          <Button variant="ghost" size="sm" className="min-w-[225px] min-h-[42px] px-4 rounded-[10px] border border-line bg-white text-muted text-[11px] flex items-center gap-8">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>
            </svg>
            <span className="flex-1 text-left">Buscar no seu bairro</span>
            <kbd className="ml-auto border border-line rounded-[5px] px-2 py-1 bg-soft text-[9px] font-mono">⌘ K</kbd>
          </Button>
        </div>
      </section>

      <div className="flex items-center gap-10 mb-6 p-4 bg-white border border-line rounded-[16px] shadow-[0_4px_18px_rgba(23,53,59,.03)]">
        <div className="w-[42px] h-[42px] rounded-full bg-brand-pale text-brand grid place-items-center font-extrabold text-[12px] flex-0 flex-none">AS</div>
        <Button variant="ghost" size="md" className="flex-1 min-h-[42px] rounded-[20px] bg-soft text-muted text-left text-[12px] px-6" onClick={openComposer}>
          Compartilhe um problema ou uma ideia...
        </Button>
        <Button variant="secondary" size="sm" className="flex items-center gap-6 min-h-[38px] px-8 text-[11px] font-extrabold" onClick={openComposer}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-accent"><path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/></svg>
          Problema
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-6 min-h-[38px] px-8 text-[11px] font-extrabold text-[#ad7814]" onClick={openComposer}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/></svg>
          Ideia
        </Button>
      </div>

      <div className="flex justify-between items-center gap-12 mb-4">
        <div className="flex gap-18">
          {["Para você", "Recentes", "Mais apoiados"].map((item) => (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              className={`px-1 pb-2 text-[11px] font-extrabold border-b-2 border-transparent ${tab === item ? "text-brand border-brand" : "text-muted"}`}
              onClick={() => setTab(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterChip active>Todo Cariacica</FilterChip>
          <FilterChip>Meu bairro</FilterChip>
          <FilterChip><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16M7 12h10M10 19h4"/></svg> Filtros</FilterChip>
        </div>
      </div>

      <div className="feed-list grid gap-[14px]">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </>
  );
}
