import { describe, expect, it } from "vitest";

import { fail, ok } from "@/shared/kernel/result";

import { PublicationMedia } from "../domain/publication-media";
import type {
  LocationValidator,
  PublicationRepository,
  PublicationRow,
  PublicationSession,
} from "./ports";
import {
  CreatePublication,
  DeleteMyPublication,
  GetPublication,
  ListFeed,
  UpdateMyPublication,
} from "./use-cases";

const USER = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const PUB = "11111111-1111-4111-8111-111111111111";

const ROW: PublicationRow = {
  id: PUB,
  author_id: USER,
  type: "problem",
  title: "Buraco na rua principal",
  content: "A rua está esburacada e oferece risco aos pedestres e ciclistas.",
  is_anonymous: false,
  city_id: 3201308,
  neighborhood_id: null,
  edited_at: null,
  hidden_at: null,
  hidden_by: null,
  deleted_at: null,
  created_at: "2026-10-11T10:00:00.000Z",
};

function fakeRepo(overrides: Partial<PublicationRepository> = {}): PublicationRepository {
  return {
    async create() {},
    async findById(id) {
      return id === PUB ? ROW : null;
    },
    async findMediaRows() {
      return [];
    },
    async listPublicFeed() {
      return { rows: [ROW], nextCursor: null };
    },

    async listPublicByAuthor(authorId) {
      return { rows: ROW.author_id === authorId ? [ROW] : [] };
    },

    async countPublicByAuthor(authorId) {
      return ROW.author_id === authorId ? 1 : 0;
    },

    async updateEditableFields() {},
    async replaceMedia() {},
    async softDelete() {},
    ...overrides,
  };
}

/** Validador de localização com bairro obrigatório opcional (P6). */
function fakeLocation(
  options: { ok?: boolean; hasCurated?: boolean; error?: string } = {},
): LocationValidator {
  return {
    async validate() {
      if (options.ok === false) {
        return fail(options.error ?? "bairro não pertence à cidade selecionada");
      }
      return ok({
        cityName: "Cariacica",
        neighborhoodName: null,
        hasCuratedNeighborhoods: options.hasCurated ?? false,
      });
    },
  };
}

function session(userId: string, emailConfirmed = true): () => Promise<PublicationSession | null> {
  return async () => ({ userId, emailConfirmed });
}

function media() {
  return [PublicationMedia.create({ path: "a.webp", position: 1, byteSize: 2048 })];
}

const baseParams = {
  type: "problem",
  title: "Buraco na rua principal",
  content: "A rua está esburacada e oferece risco aos pedestres e ciclistas.",
  isAnonymous: false,
  cityId: 3201308,
  neighborhoodId: null,
  media: media(),
};

describe("CreatePublication", () => {
  it("cria com sessão confirmada", async () => {
    let created: unknown = null;
    const useCase = new CreatePublication(session(USER), fakeLocation(), fakeRepo({
      async create(input) {
        created = input;
      },
    }));

    const result = await useCase.execute(baseParams);

    expect(result.ok).toBe(true);
    expect(created).toMatchObject({ authorId: USER, type: "problem", cityId: 3201308 });
  });

  it("exige sessão (P3)", async () => {
    const useCase = new CreatePublication(async () => null, fakeLocation(), fakeRepo());
    const result = await useCase.execute(baseParams);
    expect(result).toEqual({ ok: false, error: "sessão necessária para publicar" });
  });

  it("exige e-mail confirmado (P3)", async () => {
    const useCase = new CreatePublication(session(USER, false), fakeLocation(), fakeRepo());
    const result = await useCase.execute(baseParams);
    expect(result).toEqual({ ok: false, error: "confirme seu e-mail para publicar" });
  });

  it("rejeita bairro de outra cidade (G4)", async () => {
    const useCase = new CreatePublication(session(USER), fakeLocation({ ok: false }), fakeRepo());
    const result = await useCase.execute({ ...baseParams, neighborhoodId: "uuid" });
    expect(result.ok).toBe(false);
  });

  it("exige bairro em município com curadoria (P6)", async () => {
    const useCase = new CreatePublication(
      session(USER),
      fakeLocation({ hasCurated: true }),
      fakeRepo(),
    );
    const result = await useCase.execute(baseParams);
    expect(result).toEqual({ ok: false, error: "bairro é obrigatório em Cariacica" });
  });

  it("permite cidade sem bairro fora da curadoria (P12)", async () => {
    const useCase = new CreatePublication(
      session(USER),
      fakeLocation({ hasCurated: false }),
      fakeRepo(),
    );
    const result = await useCase.execute(baseParams);
    expect(result.ok).toBe(true);
  });

  it("rejeita título curto (P2)", async () => {
    const useCase = new CreatePublication(session(USER), fakeLocation(), fakeRepo());
    const result = await useCase.execute({ ...baseParams, title: "abc" });
    expect(result.ok).toBe(false);
  });
});

describe("UpdateMyPublication", () => {
  it("edita a própria publicação", async () => {
    const useCase = new UpdateMyPublication(session(USER), fakeRepo());
    const result = await useCase.execute({
      id: PUB,
      title: "Buraco na rua principal ainda",
      content: "O buraco continua e já houve um acidente com bicicleta.",
      media: media(),
    });
    expect(result.ok).toBe(true);
  });

  it("nega edição de publicação de outro autor (P7)", async () => {
    const useCase = new UpdateMyPublication(session(OTHER), fakeRepo());
    const result = await useCase.execute({
      id: PUB,
      title: "Título novo válido",
      content: "Conteúdo novo com tamanho suficiente para passar.",
      media: [],
    });
    expect(result).toEqual({ ok: false, error: "você só pode editar suas próprias publicações" });
  });
});

describe("DeleteMyPublication", () => {
  it("apaga logicamente a própria publicação (P8)", async () => {
    let deletedAt: Date | null = null;
    const useCase = new DeleteMyPublication(
      session(USER),
      fakeRepo({
        async softDelete(_id, when) {
          deletedAt = when;
        },
      }),
    );
    const result = await useCase.execute(PUB);
    expect(result.ok).toBe(true);
    expect(deletedAt).toBeInstanceOf(Date);
  });

  it("nega apagar publicação de outro autor", async () => {
    const useCase = new DeleteMyPublication(session(OTHER), fakeRepo());
    const result = await useCase.execute(PUB);
    expect(result).toEqual({ ok: false, error: "você só pode apagar suas próprias publicações" });
  });
});

describe("ListFeed e GetPublication", () => {
  it("feed oculta apagadas e ocultas e pagina (P8/P9)", async () => {
    const useCase = new ListFeed(fakeRepo());
    const { items, nextCursor } = await useCase.execute({ limit: 10 });
    expect(items).toHaveLength(1);
    expect(items[0].createdAt).toBeInstanceOf(Date);
    expect(nextCursor).toBeNull();
  });

  it("leitura pública usa projeção anônima (P4)", async () => {
    const useCase = new GetPublication(
      fakeRepo({
        async findById() {
          return { ...ROW, is_anonymous: true };
        },
      }),
    );
    const view = await useCase.execute(PUB);
    expect(view?.authorId).toBeNull();
    expect(view?.isAnonymous).toBe(true);
  });

  it("publicação oculta não é legível publicamente (P9)", async () => {
    const useCase = new GetPublication(
      fakeRepo({
        async findById() {
          return { ...ROW, hidden_at: "2026-10-11T12:00:00.000Z" };
        },
      }),
    );
    expect(await useCase.execute(PUB)).toBeNull();
  });
});
