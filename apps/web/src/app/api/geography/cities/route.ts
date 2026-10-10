import {
  SearchCities,
} from "@/contexts/geography/application/use-cases";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";

// Leitura pública do catálogo de cidades (contexto Geography, invariante G5).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const term = params.get("q") ?? "";
  const uf = params.get("uf");
  const limit = Number(params.get("limit") ?? "10");

  if (term.trim().length > 0 && term.trim().length < 2) {
    return Response.json({ error: "termo de busca precisa de ao menos 2 caracteres" }, { status: 400 });
  }

  try {
    const useCase = new SearchCities(new SupabaseCityRepository());
    const cities = await useCase.execute({
      term,
      uf: uf && uf.trim().length > 0 ? uf : null,
      limit: Number.isFinite(limit) ? limit : 10,
    });

    return Response.json({ cities });
  } catch {
    return Response.json({ error: "falha ao buscar cidades" }, { status: 500 });
  }
}
