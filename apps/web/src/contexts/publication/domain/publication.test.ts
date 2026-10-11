import { describe, expect, it } from "vitest";

import { PublicationMedia } from "./publication-media";
import { Publication } from "./publication";
import { PublicationType } from "./publication-type";
import { Content, Title } from "./title-content";

function createPublication(
  overrides: Partial<Parameters<typeof Publication.create>[0]> = {},
): Publication {
  return Publication.create({
    id: "11111111-1111-4111-8111-111111111111",
    authorId: "22222222-2222-4222-8222-222222222222",
    type: PublicationType.problem(),
    title: "Buraco na rua principal",
    content: "A rua está esburacada e oferece risco aos pedestres e ciclistas.",
    isAnonymous: false,
    cityId: 3201308,
    neighborhoodId: null,
    ...overrides,
  });
}

describe("PublicationType", () => {
  it("aceita problem e idea", () => {
    expect(PublicationType.create("problem").label).toBe("Problema");
    expect(PublicationType.create("idea").label).toBe("Ideia");
  });

  it("rejeita qualquer outro valor (P1)", () => {
    expect(() => PublicationType.create("event")).toThrow(/inválido/);
  });
});

describe("Title e Content", () => {
  it("respeitam os limites (P2)", () => {
    expect(() => Title.create("abc")).toThrow(/5 e 120/);
    expect(() => Title.create("a".repeat(121))).toThrow(/5 e 120/);
    expect(() => Content.create("curto")).toThrow(/10 e 5000/);
    expect(() => Content.create("a".repeat(5001))).toThrow(/10 e 5000/);
  });

  it("Content gera resumo para o feed", () => {
    const content = Content.create("a".repeat(300));
    expect(content.excerpt).toHaveLength(158);
    expect(content.excerpt.endsWith("…")).toBe(true);
  });
});

describe("Publication", () => {
  it("cria com invariantes básicas", () => {
    const publication = createPublication();
    expect(publication.type.value).toBe("problem");
    expect(publication.isPubliclyVisible).toBe(true);
    expect(publication.media).toHaveLength(0);
  });

  it("projeção pública esconde o autor quando anônima (P4)", () => {
    const publica = createPublication({ isAnonymous: true }).toPublicView();
    expect(publica.authorId).toBeNull();
    expect(publica.isAnonymous).toBe(true);
  });

  it("projeção pública expõe o autor quando identificada", () => {
    const publica = createPublication().toPublicView();
    expect(publica.authorId).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("edição altera título/corpo/mídia e marca edited_at (P7)", () => {
    const publication = createPublication();
    publication.edit({
      title: "Buraco na rua principal aumentou",
      content: "O buraco cresceu após a chuva e já há pedras soltas na pista.",
      media: [PublicationMedia.create({ path: "a.webp", position: 1, byteSize: 2048 })],
    });

    expect(publication.title.value).toBe("Buraco na rua principal aumentou");
    expect(publication.editedAt).toBeInstanceOf(Date);
    expect(publication.media).toHaveLength(1);
  });

  it("apagar é exclusão lógica e some da leitura pública (P8/P9)", () => {
    const publication = createPublication();
    publication.softDelete();
    expect(publication.isDeleted).toBe(true);
    expect(publication.isPubliclyVisible).toBe(false);
  });

  it("eventos de domínio são registrados", () => {
    const publication = createPublication();
    publication.edit({ title: "Buraco na rua principal ainda", content: "Ainda não consertaram o problema na via.", media: [] });    publication.softDelete();
    expect(publication.pullDomainEvents().map((event) => event.eventName)).toEqual([
      "publication.publication_updated",
      "publication.publication_deleted",
    ]);
  });
});
