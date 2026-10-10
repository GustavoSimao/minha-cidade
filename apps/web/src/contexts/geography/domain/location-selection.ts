import { IbgeCode } from "./city";

/**
 * Par cidade/bairro selecionado pelo usuário (invariantes G4 e G6).
 *
 * - `cityId` é obrigatório sempre que há seleção.
 * - `neighborhoodId` nulo é válido: cidade sem bairro (G6).
 * - A verificação de que o bairro pertence à cidade (G4) é do caso de uso
 *   `ValidateLocationSelection`, que consulta o catálogo; o banco garante a
 *   regra pela FK composta em `identity.profiles`.
 */
export class LocationSelection {
  private constructor(
    public readonly cityId: IbgeCode | null,
    public readonly neighborhoodId: string | null,
  ) {}

  public static create(params: {
    cityId: number | null;
    neighborhoodId: string | null;
  }): LocationSelection {
    const { cityId, neighborhoodId } = params;

    if (neighborhoodId !== null && cityId === null) {
      // G4: bairro sem cidade é seleção inválida.
      throw new Error("bairro selecionado exige a cidade correspondente");
    }

    return new LocationSelection(
      cityId === null ? null : IbgeCode.create(cityId),
      neighborhoodId,
    );
  }

  /** true se há alguma localização selecionada. */
  public get hasCity(): boolean {
    return this.cityId !== null;
  }

  /** true se o bairro foi informado (G6: pode ser falso com cidade definida). */
  public get hasNeighborhood(): boolean {
    return this.neighborhoodId !== null;
  }
}
