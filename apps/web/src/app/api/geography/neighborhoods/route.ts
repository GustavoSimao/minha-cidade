import { ListNeighborhoodsByCity } from "@/contexts/geography/application/use-cases";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";

// Leitura pública do catálogo de bairros (contexto Geography, invariantes G5/G6).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cityId = Number(params.get("cityId"));

  if (!Number.isInteger(cityId) || cityId <= 0) {
    return Response.json({ error: "cityId inválido" }, { status: 400 });
  }

  try {
    const useCase = new ListNeighborhoodsByCity(new SupabaseNeighborhoodRepository());
    const neighborhoods = await useCase.execute(cityId);

    return Response.json({ neighborhoods });
  } catch {
    return Response.json({ error: "falha ao buscar bairros" }, { status: 500 });
  }
}
