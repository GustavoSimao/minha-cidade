"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { CityOption } from "@/contexts/geography/application/ports";
import { Icon } from "@/shared/ui/icon";

type SearchState =
  | { term: string; status: "idle" | "loading" }
  | { term: string; status: "done"; cities: CityOption[]; error: string | null };

export function CityExplorer() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState<SearchState>({ term: "", status: "idle" });
  const sequence = useRef(0);

  useEffect(() => {
    if (search.status !== "loading") return;
    const query = search.term.trim();
    const current = ++sequence.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/geography/cities?q=${encodeURIComponent(query)}&limit=20`);
        const data: { cities?: CityOption[]; error?: string } = await response.json();
        if (current !== sequence.current) return;
        setSearch({
          term: query,
          status: "done",
          cities: response.ok ? data.cities ?? [] : [],
          error: response.ok ? null : data.error ?? "Não foi possível buscar cidades agora.",
        });
      } catch {
        if (current === sequence.current) {
          setSearch({ term: query, status: "done", cities: [], error: "Não foi possível buscar cidades agora." });
        }
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [search]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (term.trim().length < 2) {
      setSearch({ term: term.trim(), status: "done", cities: [], error: "Digite ao menos 2 letras para buscar." });
      return;
    }
    setSearch({ term, status: "loading" });
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-stamp">
        <div className="bg-brand px-6 py-8 text-white sm:px-10 sm:py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold">
            <Icon name="map" size={16} /> Comunidades pelo Brasil
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
            Explore o que acontece em outras cidades.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            Encontre um município e veja as publicações públicas da comunidade local.
          </p>
        </div>

        <div className="p-5 sm:p-8">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
            <label className="sr-only" htmlFor="explore-city">Buscar cidade</label>
            <div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-line bg-soft px-4 focus-within:border-brand focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-brand">
              <Icon name="search" size={19} className="shrink-0 text-muted" />
              <input
                autoComplete="address-level2"
                className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
                id="explore-city"
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Ex.: Cariacica, Vitória, Recife…"
                type="search"
                value={term}
              />
            </div>
            <button className="min-h-12 rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand" type="submit">
              {search.status === "loading" ? "Buscando…" : "Buscar cidades"}
            </button>
          </form>

          {search.status === "done" ? (
            <div aria-live="polite" className="mt-6">
              {search.error ? <p className="text-sm text-danger" role="status">{search.error}</p> : null}
              {!search.error && search.cities.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-soft p-4 text-sm text-muted">
                  Nenhuma cidade encontrada para “{search.term}”. Tente outro nome.
                </p>
              ) : null}
              {search.cities.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {search.cities.map((city) => (
                    <li key={city.id}>
                      <button
                        className="group flex min-h-[76px] w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left transition hover:bg-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        onClick={() => router.push(`/?cidade=${city.id}`)}
                        type="button"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand">
                          <Icon name="pin" size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-ink">{city.name}</span>
                          <span className="mt-1 block text-xs text-muted">{city.uf} · Ver feed da cidade</span>
                        </span>
                        <Icon name="chevron" size={18} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">Pesquise por nome ou parte do nome do município.</p>
          )}
        </div>
      </div>
    </section>
  );
}
