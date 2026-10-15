import { describe, expect, it } from "vitest";

import { COMMENT_EDIT_WINDOW_MINUTES, Comment } from "./comment";

const MINUTE = 60_000;

describe("Comment (E3/E4/E5)", () => {
  it("cria com conteúdo válido", () => {
    const comment = Comment.create({
      id: "c1",
      publicationId: "p1",
      authorId: "u1",
      content: "  Concordo com a ideia!  ",
      isAnonymous: false,
    });

    expect(comment.content.value).toBe("Concordo com a ideia!");
    expect(comment.isAnonymous).toBe(false);
    expect(comment.isDeleted).toBe(false);
  });

  it("rejeita conteúdo fora de 2–2.000 caracteres (E3)", () => {
    expect(() =>
      Comment.create({ id: "c1", publicationId: "p1", authorId: "u1", content: "a", isAnonymous: false }),
    ).toThrow("comentário deve ter entre 2 e 2000 caracteres");

    expect(() =>
      Comment.create({
        id: "c1",
        publicationId: "p1",
        authorId: "u1",
        content: "a".repeat(2001),
        isAnonymous: false,
      }),
    ).toThrow("comentário deve ter entre 2 e 2000 caracteres");
  });

  it("edita dentro da janela e marca edited_at (E5)", () => {
    const createdAt = new Date("2026-10-11T12:00:00.000Z");
    const comment = Comment.create({
      id: "c1",
      publicationId: "p1",
      authorId: "u1",
      content: "texto inicial",
      isAnonymous: false,
      createdAt,
    });

    const inside = new Date(createdAt.getTime() + (COMMENT_EDIT_WINDOW_MINUTES - 1) * MINUTE);
    expect(comment.canEditAt(inside)).toBe(true);

    comment.edit("texto corrigido", inside);
    expect(comment.content.value).toBe("texto corrigido");
    expect(comment.editedAt).toEqual(inside);

    const events = comment.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("engagement.comment_edited");
  });

  it("não edita fora da janela de 15 minutos (E5)", () => {
    const createdAt = new Date("2026-10-11T12:00:00.000Z");
    const comment = Comment.create({
      id: "c1",
      publicationId: "p1",
      authorId: "u1",
      content: "texto inicial",
      isAnonymous: false,
      createdAt,
    });

    const outside = new Date(createdAt.getTime() + COMMENT_EDIT_WINDOW_MINUTES * MINUTE + 1);
    expect(comment.canEditAt(outside)).toBe(false);
    expect(() => comment.edit("tarde demais", outside)).toThrow(
      "comentário só pode ser editado em até 15 minutos",
    );
  });

  it("apaga logicamente e deixa de ser editável (E5)", () => {
    const comment = Comment.create({
      id: "c1",
      publicationId: "p1",
      authorId: "u1",
      content: "texto inicial",
      isAnonymous: false,
    });

    comment.softDelete();

    expect(comment.isDeleted).toBe(true);
    expect(comment.deletedAt).toBeInstanceOf(Date);
    expect(comment.canEditAt(new Date())).toBe(false);

    const events = comment.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("engagement.comment_deleted");
  });

  it("projeção pública esconde o autor quando anônimo (E4/P4)", () => {
    const comment = Comment.create({
      id: "c1",
      publicationId: "p1",
      authorId: "u1",
      content: "texto anonimo",
      isAnonymous: true,
    });

    expect(comment.toPublicView().authorId).toBeNull();
  });

  it("rehydrate reconstrói o estado persistido", () => {
    const createdAt = new Date("2026-10-11T12:00:00.000Z");
    const editedAt = new Date("2026-10-11T12:05:00.000Z");

    const comment = Comment.rehydrate({
      id: "c1",
      publicationId: "p1",
      authorId: "u1",
      content: "persistido",
      isAnonymous: false,
      editedAt,
      deletedAt: null,
      createdAt,
    });

    expect(comment.content.value).toBe("persistido");
    expect(comment.editedAt).toEqual(editedAt);
    expect(comment.createdAt).toEqual(createdAt);
  });
});
