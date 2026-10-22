"use client";

import { useState } from "react";
import { Button } from "./button";
import { Avatar } from "./avatar";
import Image from "next/image";

interface PostProps {
  id: number;
  type: "Problema" | "Ideia";
  author: string;
  handle: string;
  time: string;
  neighborhood: string;
  title: string;
  body: string;
  image?: string;
  support: number;
  oppose: number;
  comments: number;
  avatar: string;
  verified?: boolean;
}

export function PostCard({ post }: { post: PostProps }) {
  const [reaction, setReaction] = useState<"support" | "oppose" | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <article className="post-card rounded-[16px] border border-line bg-white p-5 pt-0 overflow-hidden">
      <div className="post-head flex items-center gap-4 mb-4">
        <Avatar
          name={post.author}
          size={42}
          variant={post.author === "Morador anônimo" ? "anonymous" : "default"}
        >
          {post.avatar}
        </Avatar>
        <div className="post-author flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <b className="text-[12px] text-ink">{post.author}</b>
            {post.verified && (
              <span className="w-[15px] h-[15px] grid place-items-center bg-brand text-white rounded-full">
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 4 4L19 6"/>
                </svg>
              </span>
            )}
          </div>
          <span className="text-[9px] text-muted">{post.handle} · {post.time}</span>
        </div>
        <Button variant="ghost" size="sm" className="p-2" aria-label="Mais opções">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
          </svg>
        </Button>
      </div>

      <div className="post-meta flex items-center gap-4 md:gap-10 mb-4 text-muted text-[9px] font-semibold">
        <span className={`inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.4px] ${post.type === "Ideia" ? "bg-[#fff6de] text-[#966811]" : "bg-[#fff0ec] text-danger"}`}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {post.type === "Ideia" ? (<><path d="M9 18h6M10 22h4"/><path d="M8 14a7 7 0 1 1 8 0c-1 .8-1 2-1 2H9s0-1.2-1-2Z"/></>) : (<><path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/></>)}
          </svg>
          {post.type}
        </span>
        <span className="flex items-center gap-4">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
          </svg>
          {post.neighborhood}
        </span>
      </div>

      <h3 className="post-title text-[17px] font-extrabold text-ink leading-[1.35] tracking-[-.3px] mb-2">{post.title}</h3>
      <p className="post-body text-[11px] text-[#52686c] leading-[1.7] mb-4 whitespace-pre-line">{post.body}</p>

      {post.image && (
        <Image className="post-image mb-4 h-[255px] w-full rounded-[11px] object-cover" src={post.image} alt={post.title} width={900} height={600} unoptimized loading="lazy" />
      )}

      <div className="post-stats flex justify-between text-muted text-[9px] pb-3 border-b border-line">
        <span><b className="text-ink">{post.support + (reaction === "support" ? 1 : 0)}</b> apoios</span>
        <span>{post.comments} comentários</span>
      </div>

      <div className="post-actions flex items-center gap-2 mt-4">
        <Button
          variant={reaction === "support" ? "secondary" : "ghost"}
          size="sm"
          className="reaction flex items-center gap-6 rounded-[7px] py-2 px-3 text-[10px] font-extrabold"
          onClick={() => setReaction(reaction === "support" ? null : "support")}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m7 11 3 3 7-7"/>
          </svg>
          Apoiar
        </Button>

        <Button
          variant={reaction === "oppose" ? "secondary" : "ghost"}
          size="sm"
          className="reaction flex items-center gap-6 rounded-[7px] py-2 px-3 text-[10px] font-extrabold"
          onClick={() => setReaction(reaction === "oppose" ? null : "oppose")}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m7 7 10 10M17 7 7 17"/>
          </svg>
          Opor-se
        </Button>

        <Button variant="ghost" size="sm" className="reaction flex items-center gap-6 rounded-[7px] py-2 px-3 text-[10px] font-extrabold">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4 4h10a4 4 0 0 1 4 4Z"/>
          </svg>
          {post.comments}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="save-button ml-auto p-2 rounded-[7px]"
          onClick={() => setSaved(!saved)}
          title="Salvar para depois"
        >
          <svg width={19} height={19} viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 3h12v18l-6-4-6 4Z"/>
          </svg>
        </Button>
      </div>
    </article>
  );
}
