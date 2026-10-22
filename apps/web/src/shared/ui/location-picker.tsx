"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { CityOption, NeighborhoodOption } from "@/contexts/geography/application/ports";
import { Select } from "@/shared/ui/select";

export interface LocationPickerProps {
  /** Cidade atualmente selecionada no perfil (pode ser null). */
  initialCityId: number | null;
  initialCityName: string | null;
  initialCityUf: string | null;
  /** Bairro atualmente selecionado (G6: pode ser null com cidade definida). */
  initialNeighborhoodId: string | null;
  /** Cidade de lançamento (Cariacica/ES) oferecida como atalho (P12). */
  launchCity: CityOption | null;
}

type NeighborhoodRequest =
  | { cityId: number; loading: true }
  | { cityId: number; loading: false; items: NeighborhoodOption[]; error: string | null };

type SearchRequest =
  | { term: string; loading: true }
  | { term: string; loading: false; items: CityOption[]; error: string | null };

/**
 * Seletor em cascata cidade → bairro (contexto Geography, invariantes G4/G6).
 *
 * Escreve nos campos `cityId`/`neighborhoodId` consumidos pela server action de
 * atualização de perfil. O usuário nunca cria cidade ou bairro (G5): só escolhe
 * entre os catálogos servidos por `/api/geography/*`.
 */
export function LocationPicker({
  initialCityId,
  initialCityName,
  initialCityUf,
  initialNeighborhoodId,
  launchCity,
}: LocationPickerProps) {
  const fieldId = useId();

  const initialOption: CityOption | null =
    initialCityId !== null && initialCityName && initialCityUf
      ? { id: initialCityId, name: initialCityName, uf: initialCityUf, slug: "" }
      : null;

  const [currentOption, setCurrentOption] = useState<CityOption | null>(initialOption);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(initialNeighborhoodId);

const [term, setTerm] = useState("");
const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);

const [neighborhoodRequest, setNeighborhoodRequest] = useState<NeighborhoodRequest | null>(
  initialOption ? { cityId: initialOption.id, loading: true } : null,
);

const searchSeq = useRef(0);

// Cidade de lançamento não aparece automaticamente: a lista só oferece
// resultados depois que a pessoa começa uma busca.
const options = useMemo(() => {
  const merged = [
    ...(launchCity && term.trim().length >= 2 &&
    launchCity.name.toLocaleLowerCase().includes(term.trim().toLocaleLowerCase())
      ? [launchCity]
      : []),
    ...(searchRequest !== null && !searchRequest.loading ? searchRequest.items : []),
  ];
  return merged.filter(
    (option, index) => merged.findIndex((o) => o.id === option.id) === index,
  );
}, [launchCity, searchRequest, term]);

const searchLoading = searchRequest !== null && searchRequest.loading;
const searchError =
  searchRequest !== null && !searchRequest.loading ? searchRequest.error : null;

// Busca de cidades com debounce de 250ms; o estado só muda nos callbacks.
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

      if (!response.ok) {
        setSearchRequest({
          term: query,
          loading: false,
          items: [],
          error: data.error ?? "falha ao buscar cidades",
        });
        return;
      }

      setSearchRequest({ term: query, loading: false, items: data.cities ?? [], error: null });
    } catch {
      if (seq === searchSeq.current) {
        setSearchRequest({
          term: query,
          loading: false,
          items: [],
          error: "falha ao buscar cidades",
        });
      }
    }
  }, 250);

  return () => clearTimeout(timer);
}, [searchRequest]);

  // Bairros da cidade selecionada (vazio = município sem curadoria — G6).
  useEffect(() => {
    if (neighborhoodRequest === null || !neighborhoodRequest.loading) {
      return;
    }

    const { cityId } = neighborhoodRequest;
    let active = true;

    fetch(`/api/geography/neighborhoods?cityId=${cityId}`)
      .then(async (response) => {
        const data: { neighborhoods?: NeighborhoodOption[]; error?: string } =
          await response.json();

        if (!active) {
          return;
        }

        setNeighborhoodRequest({
          cityId,
          loading: false,
          items: response.ok ? (data.neighborhoods ?? []) : [],
          error: response.ok ? null : (data.error ?? "falha ao buscar bairros"),
        });
      })
      .catch(() => {
        if (active) {
          setNeighborhoodRequest({
            cityId,
            loading: false,
            items: [],
            error: "falha ao buscar bairros",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [neighborhoodRequest]);

  function chooseCity(option: CityOption) {
    // Trocar de cidade sempre limpa o bairro (G4: o par precisa ser consistente).
    setCurrentOption(option);
    setNeighborhoodId(null);
    setTerm("");
    setSearchRequest(null);
    setNeighborhoodRequest({ cityId: option.id, loading: true });
  }

  function clearCity() {
    setCurrentOption(null);
    setNeighborhoodId(null);
    setTerm("");
    setSearchRequest(null);
    setNeighborhoodRequest(null);
  }

  function onCityTermChange(value: string) {
    setTerm(value);

    // Reset feito no handler do evento (não em efeito).
    setSearchRequest(value.trim().length < 2 ? null : { term: value.trim(), loading: true });
  }

  const cityLabel = currentOption ? `${currentOption.name} — ${currentOption.uf}` : null;

  let neighborhoodArea: React.ReactNode;
  if (currentOption === null) {
    neighborhoodArea = (
      <p className="text-sm text-text-muted">Escolha a cidade para ver os bairros.</p>
    );
  } else if (neighborhoodRequest === null) {
    neighborhoodArea = null;
  } else if (neighborhoodRequest.loading) {
    neighborhoodArea = <p className="text-sm text-text-muted">Carregando bairros…</p>;
  } else if (neighborhoodRequest.error !== null) {
    neighborhoodArea = (
      <p className="text-sm text-danger" role="alert">
        {neighborhoodRequest.error}
      </p>
    );
  } else if (neighborhoodRequest.items.length === 0) {
    neighborhoodArea = (
      <p className="text-sm text-text-muted">
        Bairro não informado — {cityLabel ?? "esta cidade"} ainda não tem lista oficial de bairros.
      </p>
    );
  } else {
    neighborhoodArea = (
      <Select
        id={`${fieldId}-neighborhood`}
        label="Bairro"
        onChange={(event) => setNeighborhoodId(event.target.value || null)}
        value={neighborhoodId ?? ""}
      >
        <option value="">Bairro não informado</option>
        {neighborhoodRequest.items.map((neighborhood) => (
          <option key={neighborhood.id} value={neighborhood.id}>
            {neighborhood.name}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input name="cityId" type="hidden" value={currentOption?.id ?? ""} />
      <input name="neighborhoodId" type="hidden" value={neighborhoodId ?? ""} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-strong" htmlFor={`${fieldId}-city`}>
          Cidade
        </label>
        {cityLabel ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex min-h-9 items-center rounded-full bg-brand-50 px-3 text-sm font-medium text-brand-700">
              {cityLabel}
            </span>
            <button
              className="min-h-11 rounded-lg px-2 text-sm text-text-muted underline"
              onClick={clearCity}
              type="button"
            >
              trocar
            </button>
          </div>
        ) : (
          <>
            <input
              autoComplete="address-level2"
              className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong placeholder:text-text-muted"
              id={`${fieldId}-city`}
              onChange={(event) => onCityTermChange(event.target.value)}
              placeholder="Buscar cidade (ex.: Cariacica)"
              type="search"
              value={term}
            />
            {searchLoading ? (
              <p className="text-sm text-text-muted">Buscando…</p>
            ) : searchError ? (
              <p className="text-sm text-danger" role="alert">
                {searchError}
              </p>
            ) : term.trim().length >= 2 ? (
              <ul className="max-h-44 divide-y divide-border-subtle overflow-y-auto rounded-lg border border-border-subtle">
                {options.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-text-muted">
                    Nenhuma cidade encontrada.
                  </li>
                ) : (
                  options.map((option) => (
                    <li key={option.id}>
                      <button
                        className="min-h-11 w-full px-3 py-2 text-left text-base text-text-body hover:bg-surface"
                        onClick={() => chooseCity(option)}
                        type="button"
                      >
                        {option.name} — {option.uf}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : term.trim().length > 0 ? (
              <p className="text-sm text-text-muted">Digite ao menos 2 letras para buscar.</p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">{neighborhoodArea}</div>
    </div>
  );
}
