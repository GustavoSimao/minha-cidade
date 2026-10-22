"use client";

import { useState } from "react";

import { Button } from "./button";
import { Eyebrow } from "./eyebrow";

type PostType = "Problema" | "Ideia";

interface ComposerProps {
  close: () => void;
}

export function Composer({ close }: ComposerProps) {
  const [type, setType] = useState<PostType>("Problema");
  const [anonymous, setAnonymous] = useState(false);
  const [published, setPublished] = useState(false);

  if (published) {
    return (
      <div className="modal-backdrop fixed inset-0 z-50 bg-[#0a2024]/[.68] backdrop-blur-[4px] flex items-center justify-center p-[20px]">
        <div className="success-modal rounded-[19px] bg-white p-[38px] text-center w-[min(400px,100%)]">
          <div className="success-icon w-[60px] h-[60px] rounded-full bg-brand-pale text-brand grid place-items-center mx-auto mb-[15px] flex-0">
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6"/>
            </svg>
          </div>
          <div className="screen-title small">Publicado na sua cidade</div>
          <p className="mt-[15px] text-[10px] text-muted">Sua publicação já está visível para moradores de Cariacica.</p>
          <Button className="primary-button w-full mt-[20px] min-h-[42px] text-[10px] bg-accent text-white rounded-[12px] font-extrabold shadow-[0_7px_18px_rgba(240,107,84,.2)]" onClick={close}>
            Ver no feed
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 14 0m-5-5 5 5-5 5"/>
            </svg>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 bg-[#0a2024]/[.68] backdrop-blur-[4px] flex items-center justify-center p-[20px]">
      <div className="composer-modal rounded-[20px] bg-white p-[25px] w-[min(700px,100%)] max-h-[calc(100vh-35px)] overflow-y-auto shadow-modal">
        <div className="composer-head flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4">
              <Eyebrow>Nova publicação</Eyebrow>
            </div>
            <div className="screen-title small mt-1">O que você quer compartilhar?</div>
          </div>
          <Button className="icon-button w-[40px] h-[40px] rounded-full border border-line bg-white grid place-items-center cursor-pointer" onClick={close}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18"/>
            </svg>
          </Button>
        </div>
        <div className="type-picker grid grid-cols-2 gap-9 mt-[20px] mb-[17px]">
          <Button
            className={`type-picker-btn min-h-[67px] rounded-[11px] border border-line bg-white flex items-center gap-10 px-13 py-[10px] text-left cursor-pointer ${type === "Problema" ? "border-[#f06b54] bg-[#fff0ec] text-[#f06b54]" : "text-muted"}`}
            onClick={() => setType("Problema")}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`text-${type === "Problema" ? "#f06b54" : "muted"}`}>
              <path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/>
            </svg>
            <div>
              <b className="block text-[11px] text-ink">Problema</b>
              <span className="block text-[8px] text-muted mt-[3px]">Algo que precisa ser resolvido</span>
            </div>
            <i className="ml-auto w-[18px] h-[18px] rounded-full border border-line grid place-items-center" style={{ color: type === "Problema" ? "#fff" : "transparent", background: type === "Problema" ? "#0b6c70" : "transparent" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 4 4L19 6"/>
              </svg>
            </i>
          </Button>
          <Button
            className={`type-picker-btn min-h-[67px] rounded-[11px] border border-line bg-white flex items-center gap-10 px-13 py-[10px] text-left cursor-pointer ${type === "Ideia" ? "border-[#d59b26] bg-[#fff6de] text-[#966811]" : "text-muted"}`}
            onClick={() => setType("Ideia")}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`text-${type === "Ideia" ? "#d59b26" : "muted"}`}>
              <path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/>
            </svg>
            <div>
              <b className="block text-[11px] text-ink">Ideia</b>
              <span className="block text-[8px] text-muted mt-[3px]">Uma proposta para melhorar a cidade</span>
            </div>
            <i className="ml-auto w-[18px] h-[18px] rounded-full border border-line grid place-items-center" style={{ color: type === "Ideia" ? "#fff" : "transparent", background: type === "Ideia" ? "#0b6c70" : "transparent" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 4 4L19 6"/>
              </svg>
            </i>
          </Button>
        </div>
        <label className="field block mt-[13px]">
          <span className="block text-[9px] font-extrabold text-brand mb-6">Título</span>
          <input
            placeholder={type === "Problema" ? "Ex: Poste apagado na Rua das Flores" : "Ex: Uma nova horta comunitária"}
            maxLength={100}
            className="w-full border border-line rounded-[9px] bg-white text-ink placeholder:text-[#9aa9a9] px-4 py-3 text-[10px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/22"
          />
          <small className="absolute right-[10px] bottom-[10px] text-[7px] text-muted">0/100</small>
        </label>
        <label className="field block mt-[13px]">
          <span className="block text-[9px] font-extrabold text-brand mb-6">Conte mais detalhes</span>
          <textarea placeholder="Ajude seus vizinhos a entender o contexto..." rows={5} className="w-full border border-line rounded-[9px] bg-white text-ink placeholder:text-[#9aa9a9] px-4 py-3 text-[10px] resize-none focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/22" />
        </label>
        <div className="composer-row grid grid-cols-[1.2fr_.8fr] gap-10 mt-[13px]">
          <label className="field compact block">
            <span className="block text-[9px] font-extrabold text-brand mb-6">Localização</span>
            <Button className="fake-input w-full h-[41px] border border-line rounded-[9px] bg-white flex items-center gap-7 px-11 text-[9px] text-left cursor-pointer">
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
              </svg>
              Campo Grande, Cariacica
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-auto">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Button>
          </label>
          <div className="photo-upload h-[41px] border-2 border-dashed border-[#b8c9c7] rounded-[9px] flex items-center justify-center gap-7 text-brand text-[9px] font-bold cursor-pointer">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/>
            </svg>
            <span>Adicionar fotos</span>
            <small className="text-muted">até 3</small>
          </div>
        </div>
        <Button className={`anonymous-choice w-full mt-[14px] px-3 py-[11px] rounded-[10px] border border-line bg-soft flex items-center gap-10 text-left cursor-pointer ${anonymous ? "border-[#a6cfcc] bg-brand-pale" : ""}`} onClick={() => setAnonymous(!anonymous)}>
          <div className="anonymous-icon w-[35px] h-[35px] rounded-full bg-white text-brand grid place-items-center flex-0">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {anonymous ? (<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>) : (<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>)}
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <b className="block text-[9px] text-ink">Publicar anonimamente</b>
            <span className="block text-[8px] text-muted mt-[2px]">Seu nome não aparecerá publicamente. Só você reconhecerá a publicação.</span>
          </div>
          <div className={`toggle w-[39px] h-[22px] border-0 rounded-[20px] p-3 cursor-pointer ${anonymous ? "bg-brand" : "bg-[#bdc9c8]"}`}>
            <i className={`w-[16px] h-[16px] rounded-full bg-white block transition-transform duration-200 ${anonymous ? "translate-x-[17px]" : ""}`} />
          </div>
        </Button>
        <div className="composer-footer flex items-center justify-between gap-12 mt-[18px] pt-[17px] border-t border-line">
          <span className="flex items-center gap-5 text-[8px] text-muted">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>
            </svg>
            Sua publicação segue as regras da comunidade
          </span>
          <Button className="primary-button min-h-[42px] text-[10px] bg-accent text-white rounded-[12px] font-extrabold shadow-[0_7px_18px_rgba(240,107,84,.2)]" onClick={() => setPublished(true)}>
            Publicar {type.toLowerCase()}
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 14 0m-5-5 5 5-5 5"/>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
