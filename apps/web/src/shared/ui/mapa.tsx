"use client";

import { useState } from "react";

import { Button } from "./button";
import { Eyebrow } from "./eyebrow";

const markers = [
  { id: 1, left: "39%", top: "37%", type: "problem" as const, label: "Faixa apagada", place: "Campo Grande", icon: "alert" },
  { id: 2, left: "63%", top: "28%", type: "idea" as const, label: "Nova área de lazer", place: "Itacibá", icon: "idea" },
  { id: 3, left: "71%", top: "61%", type: "problem" as const, label: "Iluminação", place: "Alto Lage", icon: "alert" },
  { id: 4, left: "50%", top: "73%", type: "idea" as const, label: "Horta comunitária", place: "Vila Capixaba", icon: "idea" },
];

export function MapScreen() {
  const [selected, setSelected] = useState(1);

  return (
    <section className="map-screen rounded-[18px] border border-line bg-white overflow-hidden shadow-[0_8px_30px_rgba(23,53,59,.05)]">
      <div className="map-toolbar p-5 md:p-[23px_25px] flex items-end justify-between gap-4 md:gap-16 mb-4">
        <div>
          <Eyebrow>Explore Cariacica</Eyebrow>
          <div className="screen-title mt-1 max-w-[440px]">Mapa da cidade</div>
          <p className="mt-1 text-[10px] text-muted">Descubra problemas e ideias perto de você.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" className="min-h-[34px] px-4 rounded-[20px] border border-line bg-white text-[10px] font-extrabold text-brand border-brand/60 bg-brand-pale">
            Todos <b className="ml-1 bg-white rounded-[10px] px-2 py-0.5 text-[8px] font-bold">248</b>
          </Button>
          <Button variant="ghost" size="sm" className="min-h-[34px] px-4 rounded-[20px] border border-line bg-white text-[10px] font-extrabold text-muted">Problemas</Button>
          <Button variant="ghost" size="sm" className="min-h-[34px] px-4 rounded-[20px] border border-line bg-white text-[10px] font-extrabold text-muted">Ideias</Button>
        </div>
      </div>

      <div className="map-canvas relative" style={{ height: "min(670px, calc(100vh - 225px))", minHeight: "500px", background: "#e9eee7" }}>
        <svg className="city-map-art absolute inset-0 w-full h-full" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-label="Mapa ilustrado de Cariacica">
          <rect width="1000" height="650" fill="#e9eee7" />
          <path className="map-water" d="M845-30c-62 92-15 160-75 232-41 49-29 118 26 155 63 42 27 118-8 165-31 42-29 91-2 151h250V-30Z" />
          <path className="map-park" d="M70 65c55-43 145-31 170 19 23 47-20 112-92 113-69 2-119-19-127-65-5-28 14-50 49-67Z" />
          <path className="map-park" d="M605 440c43-36 121-27 143 17 20 41-18 95-81 96-60 1-104-18-110-58-4-23 13-42 48-55Z" />
          <g className="minor-roads">
            <path d="M-40 117 285 290 520 262 858 445" /><path d="M-15 505 184 376 430 410 638 248 886 142" />
            <path d="M128-25 312 154 295 348 482 570" /><path d="M397-20 439 190 650 319 762 681" />
            <path d="M-18 260 167 250 343 64 674 84 858 210" /><path d="M50 643 222 474 431 493 638 616" />
            <path d="M72 20 63 368 228 617" /><path d="M580-15 565 181 750 368 900 397" />
            <path d="M254 0 208 204 395 341 368 650" /><path d="M0 432 273 445 528 351 820 598" />
          </g>
          <g className="block-roads">
            <path d="M0 185C198 203 316 247 452 351s257 104 399 94" />
            <path d="M105 650c53-180 167-261 296-333S632 154 780-10" />
            <path d="M-20 546c195-56 338-58 494-20s255 49 368 20" />
          </g>
          <g className="main-roads">
            <path d="M-30 322c173-48 307-13 430-64S646 112 841 97" />
            <path d="M215-30c58 121 103 220 206 310s196 167 231 400" />
          </g>
          <g className="road-center">
            <path d="M-30 322c173-48 307-13 430-64S646 112 841 97" />
            <path d="M215-30c58 121 103 220 206 310s196 167 231 400" />
          </g>
          <text x="210" y="245" className="text-[9px] font-bold fill-[#9aa69d]">CAMPO GRANDE</text>
          <text x="585" y="192" className="text-[9px] font-bold fill-[#9aa69d]">ITACIBÁ</text>
          <text x="680" y="520" className="text-[9px] font-bold fill-[#9aa69d]">ALTO LAGE</text>
          <text x="300" y="535" className="text-[9px] font-bold fill-[#9aa69d]">VILA CAPIXABA</text>
          <text className="road-name" x="435" y="214" transform="rotate(-22 435 214)">Av. Expedito Garcia</text>
          <text className="road-name" x="495" y="405" transform="rotate(45 495 405)">BR–262</text>
          <text className="water-name" x="905" y="330" transform="rotate(90 905 330)">BAÍA DE VITÓRIA</text>
        </svg>

        <div className="map-floating-top absolute z-4 top-18 left-18 right-18 flex gap-4 md:gap-8 flex-wrap">
          <Button variant="ghost" size="sm" className="map-search w-full md:w-[330px] h-[44px] rounded-[10px] border-0 bg-white shadow-[0_8px_25px_rgba(23,53,59,.14)] px-14 items-center gap-9 text-left text-[10px] text-muted cursor-pointer">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>
            </svg>
            <span className="flex-1">Buscar rua ou bairro</span>
          </Button>
          <Button variant="ghost" size="sm" className="map-filter h-[44px] rounded-[10px] border-0 bg-white shadow-[0_8px_25px_rgba(23,53,59,.14)] px-12 items-center gap-6 text-[9px] font-extrabold text-ink cursor-pointer">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 5h16M7 12h10M10 19h4"/>
            </svg>
            <span>Filtros</span>
            <i className="w-[17px] h-[17px] rounded-full bg-brand grid place-items-center text-[8px] text-white">2</i>
          </Button>
        </div>

        <div className="map-summary absolute z-3 top-[80px] left-18 right-18 w-full sm:w-[190px] p-4 bg-white/[.94] backdrop-blur-[8px] shadow-[0_8px_25px_rgba(23,53,59,.14)] rounded-[12px] border border-line/[.4]">
          <span className="block text-[8px] uppercase tracking-[1px] text-muted">Nesta área</span>
          <b className="block text-[15px] text-ink mt-[4px] mb-[2px]">43 publicações</b>
          <small className="block text-[8px] text-brand">12 nas últimas 24 horas</small>
          <div className="flex items-center gap-4 border-t border-line mt-[10px] pt-[9px] text-[7px] text-muted">
            <i className="problem-dot w-[7px] h-[7px] rounded-full bg-[#f06b54]" /> 31 problemas{" "}
            <i className="idea-dot w-[7px] h-[7px] rounded-full bg-[#d59b26] ml-2" /> 12 ideias
          </div>
        </div>

        <div className="absolute z-3" style={{ left: "23%", top: "58%" }}>
          <Button aria-label="18 publicações nesta região" className="map-cluster c1 grid h-[46px] w-[46px] place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white shadow-[0_8px_25px_rgba(23,53,59,.2)]">18</Button>
        </div>
        <div className="absolute z-3" style={{ left: "77%", top: "18%" }}>
          <Button aria-label="7 publicações nesta região" className="map-cluster c2 grid h-[46px] w-[46px] place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white shadow-[0_8px_25px_rgba(23,53,59,.2)]">7</Button>
        </div>

        {markers.map((marker) => (
          <div key={marker.id} style={{ position: "absolute", left: marker.left, top: marker.top }}>
            <Button
              className={`map-marker grid h-10 w-10 rotate-45 place-items-center rounded-[50%_50%_50%_0] border-2 border-white shadow-[0_5px_14px_rgba(23,53,59,.25)] cursor-pointer transition-transform ${marker.type === "problem" ? "bg-[#c94d45] text-white" : "bg-[#d59b26] text-white"} ${selected === marker.id ? "scale-110 z-5" : ""}`}
              onClick={() => setSelected(marker.id)}
              title={`${marker.label}, ${marker.place}`}
            >
              <svg className="-rotate-45" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {marker.icon === "alert" ? (<><path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/></>) : (<><path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/></>)}
              </svg>
            </Button>
          </div>
        ))}

        <div className="map-detail-card absolute z-4 right-18 bottom-18 left-18 w-full sm:w-[285px] p-4 bg-white rounded-[14px] shadow-[0_12px_35px_rgba(23,53,59,.18)]">
          <div className="map-detail-head flex items-center gap-8">
            <span className={`font-bold ${selected === 2 || selected === 4 ? "text-[#966811]" : "text-[#b54230]"}`}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {selected === 2 || selected === 4 ? (<><path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/></>) : (<><path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/></>)}
              </svg>
              {selected === 2 || selected === 4 ? "Ideia" : "Problema"}
            </span>
            <small className="text-[8px] text-muted">há 32 min</small>
            <Button variant="ghost" size="sm" className="ml-auto p-2 text-muted">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18"/>
              </svg>
            </Button>
          </div>
          <b className="block mt-[12px] text-[9px] text-brand">{markers.find((m) => m.id === selected)?.label}</b>
          <p className="mt-[4px] mb-[9px] text-[12px] font-extrabold leading-[1.45]">
            {selected === 1 ? "Faixa de pedestres apagada perto da escola" : selected === 2 ? "Uma nova área de lazer para o bairro" : selected === 3 ? "Postes sem iluminação na rua principal" : "Horta comunitária no terreno vazio"}
          </p>
          <div className="map-detail-place flex items-center gap-4 text-[8px] text-muted">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
            </svg>
            {markers.find((m) => m.id === selected)?.place}
          </div>
          <div className="mt-[12px] pt-[10px] border-t border-line flex items-center justify-between gap-4">
            <span className="flex items-center gap-4 text-[8px] text-brand font-bold">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7 11 3 3 7-7"/>
              </svg>
              84 apoios
            </span>
            <Button variant="ghost" size="sm" className="flex items-center gap-4 text-[8px] text-brand font-bold cursor-pointer">
              Ver publicação
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 14 0m-5-5 5 5-5 5"/>
              </svg>
            </Button>
          </div>
        </div>

        <div className="map-controls absolute z-4 right-18 top-18 grid rounded-[9px] overflow-hidden shadow-[0_8px_25px_rgba(23,53,59,.14)]">
          <Button className="w-[38px] h-[36px] border-b border-line bg-white grid place-items-center text-[17px] cursor-pointer hover:bg-soft">+</Button>
          <Button className="w-[38px] h-[36px] border-b border-line bg-white grid place-items-center text-[17px] cursor-pointer hover:bg-soft">−</Button>
          <Button className="w-[38px] h-[36px] bg-white grid place-items-center text-[17px] text-brand cursor-pointer hover:bg-soft">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
            </svg>
          </Button>
        </div>

        <div className="map-legend absolute z-4 bottom-18 left-18 rounded-[9px] shadow-[0_8px_25px_rgba(23,53,59,.13)] px-[13px] py-3 bg-white flex gap-[13px] text-[8px]">
          <span className="flex items-center gap-5">
            <i className="w-[7px] h-[7px] rounded-full bg-[#f06b54]" /> Problemas
          </span>
          <span className="flex items-center gap-5">
            <i className="w-[7px] h-[7px] rounded-full bg-[#d59b26]" /> Ideias
          </span>
        </div>
      </div>
    </section>
  );
}
