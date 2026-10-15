"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { CityOption, NeighborhoodOption } from "@/contexts/geography/application/ports";
import { Button } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";

type SearchRequest =
  | { term: string; loading: true }
  | { term: string; loading: false; items: CityOption[]; error: string | null };

type NeighborhoodRequest =
  | { cityId: number; loading: true }
  | { cityId: number; loading: false; items: NeighborhoodOption[]; error: string | null };

/** Tipos de publicação (P5) e o "todos" como estado neutro do filtro. */
const TYPES = [
  { value: "problem", label: "Problemas" },
  { value: "idea", label: "Ideias" },
] as const;

/**
 * Filtros do feed (T4): cidade → bairro (cascata, igual ao perfil) e tipo.
 *
 * Não é um formulário postado: navega pelo query string (`?cidade=&bairro=&tipo=`),
 * que o feed do servidor já entende. `cursor` é descartado ao filtrar para não
 * misturar página com filtro novo.
 */
export function FeedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldId = useId();
  const searchSeq = useRef(0);

  const cityParam = searchParams.get("cidade");
  const cityId = cityParam !== null && cityParam !== "" && Number.isInteger(Number(cityParam))
    ? Number(cityParam)
    : null;
  const neighborhoodId = searchParams.get("bairro");
  const type = searchParams.get("tipo");

  const [term, setTerm] = useState("");
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [neighborhoodRequest, setNeighborhoodRequest] = useState<NeighborhoodRequest | null>(
    cityId !== null ? { cityId, loading: true } : null,
  );

  const neighborhoods =
    neighborhoodRequest !== null && !neighborhoodRequest.loading ? neighborhoodRequest.items : [];
  const neighborhoodsLoading = neighborhoodRequest?.loading === true;

  const anyFilter = cityId !== null || neighborhoodId !== null || type !== null;

  // Busca de cidades com debounce de 250ms (mesmo padrão do LocationPicker).
  useEffect(() => {
    if (searchRequest === null || !searchRequest.loading) {
      return;
    }

    const query = searchRequest.term;
    const seq = ++searchSeq.current;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geography/cities?q=${encodeURIComponent(query)}`);
        const data: { cities?: CityOption[]; error?: string } = await response.json();

        if (seq !== searchSeq.current) {
          return;
        }

        setSearchRequest({
          term: query,
          loading: false,
          items: response.ok ? (data.cities ?? []) : [],
          error: response.ok ? null : (data.error ?? "falha ao buscar cidades"),
        });
      } catch {
        if (seq === searchSeq.current) {
          setSearchRequest({ term: query, loading: false, items: [], error: "falha ao buscar cidades" });
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchRequest]);

  // Bairros da cidade escolhida (cascata — G6: bairro sem cidade não existe).
  useEffect(() => {
    if (neighborhoodRequest === null || !neighborhoodRequest.loading) {
      return;
    }

    const { cityId: id } = neighborhoodRequest;
    let active = true;

    void (async () => {
      try {
        const response = await fetch(`/api/geography/neighborhoods?cityId=${id}`);
        const data: { neighborhoods?: NeighborhoodOption[] } = await response.json();

        if (active) {
          setNeighborhoodRequest({
            cityId: id,
            loading: false,
            items: response.ok ? (data.neighborhoods ?? []) : [],
            error: null,
          });
        }
      } catch {
        if (active) {
          setNeighborhoodRequest({ cityId: id, loading: false, items: [], error: "falha ao buscar bairros" });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [neighborhoodRequest]);

  function navigate(next: { cidade?: string | null; bairro?: string | null; tipo?: string | null }) {
    const params = new URLSearchParams();
    const cidade = next.cidade ?? cityParam;
    const bairro = next.bairro ?? neighborhoodId;
    const tipo = next.tipo ?? type;

    if (cidade) {
      params.set("cidade", cidade);
    }
    if (bairro) {
      params.set("bairro", bairro);
    }
    if (tipo) {
      params.set("tipo", tipo);
    }

    const query = params.toString();
    router.push(query === "" ? "/" : `/?${query}`);
  }

  return (
    <section
      aria-label="Filtros do feed"
      className="mt-4 flex flex-col gap-4 rounded-card border border-border-subtle bg-surface-raised p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 text-sm font-medium text-text-strong">
          <label htmlFor={`${fieldId}-city`}>Cidade</label>
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong"
            id={`${fieldId}-city`}
            onChange={(event) => {
              const value = event.target.value;
              setTerm(value);
              setSearchRequest({ term: value, loading: true });
            }}
            placeholder="Buscar cidade pelo nome"
            type="search"
            value={term}
          />
        </div>
        <Button
          onClick={() => {
            setSearchRequest({ term, loading: true });
          }}
          type="button"
          variant="secondary"
        >
          Buscar
        </Button>
      </div>

      {searchRequest !== null && !searchRequest.loading && searchRequest.error !== null ? (
        <p className="text-sm text-danger" role="alert">
          {searchRequest.error}
        </p>
      ) : null}

      {searchRequest !== null && !searchRequest.loading && searchRequest.items.length > 0 ? (
        <ul className="flex flex-wrap gap-2" data-testid="city-options">
          {searchRequest.items.map((option) => (
            <li key={option.id}>
              <Button
                onClick={() => {
                  setNeighborhoodRequest({ cityId: option.id, loading: true });
                  setTerm("");
                  setSearchRequest(null);
                  navigate({ cidade: String(option.id), bairro: null });
                }}
                type="button"
                variant="secondary"
              >
                {option.name} — {option.uf}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {cityId !== null ? (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Bairro"
            name="bairro"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              navigate({ bairro: event.target.value || null })
            }
            value={neighborhoodId ?? ""}
          >
            <option value="">Todos os bairros</option>
            {neighborhoodsLoading ? <option value="">Carregando bairros…</option> : null}
            {neighborhoods.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-strong">Tipo</span>
        <Button
          aria-pressed={type === null}
          onClick={() => navigate({ tipo: null })}
          type="button"
          variant={type === null ? "primary" : "secondary"}
        >
          Todos
        </Button>
        {TYPES.map((option) => (
          <Button
            aria-pressed={type === option.value}
            key={option.value}
            onClick={() => navigate({ tipo: option.value })}
            type="button"
            variant={type === option.value ? "primary" : "secondary"}
          >
            {option.label}
          </Button>
        ))}
        {anyFilter ? (
          <Button className="ml-auto" onClick={() => router.push("/")} type="button" variant="secondary">
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </section>
  );
}
