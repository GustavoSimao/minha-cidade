import { describe, expect, it, vi } from "vitest";

import {
  AddComment,
  DeleteMyComment,
  EditMyComment,
  ListPublicationComments,
  SavePublication,
  ToggleReaction,
  UnsavePublication,
} from "./use-cases";
import type {
  CurrentEngagementSessionPort,
  EngagementRepository,
  EngagementSession,
  PublicationStatePort,
} from "./ports";

const USER = "u1";
const OTHER = "u2";
const PUB = "p1";
const PUBLICATION_AUTHOR = "author-9";

const PUBLIC_STATE: NonNullable<
  Awaited<ReturnType<PublicationStatePort["findState"]>>
> = {
  authorId: PUBLICATION_AUTHOR,
  deletedAt: null,
  hiddenAt: null,
};

function makeRepo(overrides: Partial<EngagementRepository> = {}): EngagementRepository {
  const reactionRows = new Map<string, { id: string; type: string }>();
  const commentRows = new Map<string, Record<string, unknown>>();
  const bookmarks = new Set<string>();
  const events: Record<string, unknown>[] = [];

  const base: EngagementRepository = {
    async findReactionByUser(publicationId, userId) {
      const row = reactionRows.get(`${publicationId}:${userId}`);
      return row
        ? {
            id: row.id,
            publication_id: publicationId,
            user_id: userId,
            type: row.type,
            created_at: new Date().toISOString(),
          }
        : null;
    },
    async insertReaction(input) {
      reactionRows.set(`${input.publicationId}:${input.userId}`, {
        id: input.id,
        type: input.type,
      });
    },
    async updateReactionType(publicationId, userId, type) {
      const row = reactionRows.get(`${publicationId}:${userId}`);
      if (row) {
        row.type = type;
      }
    },
    async deleteReaction(publicationId, userId) {
      reactionRows.delete(`${publicationId}:${userId}`);
    },
    async countReactions() {
      const rows = [...reactionRows.values()];
      return {
        support: rows.filter((r) => r.type === "support").length,
        oppose: rows.filter((r) => r.type === "oppose").length,
      };
    },
    async countComments() {
      return [...commentRows.values()].filter((c) => c.deleted_at === null).length;
    },

    async countsByPublicationIds(publicationIds) {
      const result: Record<string, { support: number; oppose: number; comments: number }> = {};

      for (const publicationId of publicationIds) {
        const reactions = [...reactionRows.entries()].filter(
          ([key, row]) => key.startsWith(`${publicationId}:`) && row.type !== undefined,
        );
        const comments = [...commentRows.values()].filter(
          (row) => row.publication_id === publicationId && row.deleted_at === null,
        );

        result[publicationId] = {
          support: reactions.filter(([, row]) => row.type === "support").length,
          oppose: reactions.filter(([, row]) => row.type === "oppose").length,
          comments: comments.length,
        };
      }

      return result;
    },

async countSupportedByUser() {
      return [...reactionRows.values()].filter((row) => row.type === "support").length;
    },

    async countReactionsReceivedByUser() {
      // Simplificado: retorna contadores zerados no fake
      return { support: 0, oppose: 0 };
    },

    async countCommentsReceivedByUser() {
      return 0;
    },

    async listComments(publicationId, options) {
      const all = [...commentRows.values()]
        .filter((row) => row.publication_id === publicationId)
        .filter((row) => row.deleted_at === null && row.hidden_at === null)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

      let rows = all;
      if (options.before) {
        rows = rows.filter((row) => String(row.created_at) < String(options.before));
      }

      const page = rows.slice(0, options.limit);
      const hasMore = rows.length > options.limit;

      return {
        rows: (page as never[]).map((row) => ({
          id: String((row as { id: unknown }).id),
          publication_id: publicationId,
          author_id: (row as { author_id: unknown }).author_id as string | null,
          content: String((row as { content: unknown }).content),
          is_anonymous: Boolean((row as { is_anonymous: unknown }).is_anonymous),
          edited_at: (row as { edited_at: unknown }).edited_at as string | null,
          hidden_at: null,
          deleted_at: null,
          created_at: String((row as { created_at: unknown }).created_at),
        })),
        nextCursor: hasMore ? String((page[page.length - 1] as { created_at: unknown }).created_at) : null,
      };
    },
    async findCommentById(id) {
      const row = commentRows.get(id);
      return row === undefined ? null : (row as never);
    },
    async insertComment(input) {
      commentRows.set(input.id, {
        id: input.id,
        publication_id: input.publicationId,
        author_id: input.authorId,
        content: input.content,
        is_anonymous: input.isAnonymous,
        edited_at: null,
        hidden_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
      });
    },
    async updateCommentContent(id, content) {
      const row = commentRows.get(id);
      if (row) {
        row.content = content;
        row.edited_at = new Date().toISOString();
      }
    },
    async softDeleteComment(id) {
      const row = commentRows.get(id);
      if (row) {
        row.deleted_at = new Date().toISOString();
      }
    },
    async isBookmarked(publicationId, userId) {
      return bookmarks.has(`${userId}:${publicationId}`);
    },
    async addBookmark(publicationId, userId) {
      bookmarks.add(`${userId}:${publicationId}`);
    },
    async removeBookmark(publicationId, userId) {
      bookmarks.delete(`${userId}:${publicationId}`);
    },
    async listSavedPublicationIds(userId) {
      const ids = [...bookmarks]
        .filter((key) => key.startsWith(`${userId}:`))
        .map((key) => key.slice(userId.length + 1));

      return { ids, nextCursor: null };
    },
    async listBookmarkedIds(userId, publicationIds) {
      return publicationIds.filter((id) => bookmarks.has(`${userId}:${id}`));
    },
    async recordEvent(event) {
      events.push(event);
    },
  };

  return { ...base, ...overrides } as EngagementRepository & { __events?: unknown[] };
}

function sessionOf(session: EngagementSession | null): CurrentEngagementSessionPort {
  return vi.fn().mockResolvedValue(session) as CurrentEngagementSessionPort;
}

function publicationStateOf(
  state: Awaited<ReturnType<PublicationStatePort["findState"]>>,
): PublicationStatePort {
  return { findState: vi.fn().mockResolvedValue(state) as PublicationStatePort["findState"] };
}

const CONFIRMED: EngagementSession = { userId: USER, emailConfirmed: true };

describe("ToggleReaction (E1/E2/E8)", () => {
  it("adiciona reação quando não existe", async () => {
    const repo = makeRepo();
    const useCase = new ToggleReaction(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    const result = await useCase.execute({ publicationId: PUB, type: "support" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("added");
    }
    expect((await repo.findReactionByUser(PUB, USER))?.type).toBe("support");
  });

  it("remove quando o mesmo tipo é repetido (E1)", async () => {
    const repo = makeRepo();
    const useCase = new ToggleReaction(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    await useCase.execute({ publicationId: PUB, type: "support" });
    const result = await useCase.execute({ publicationId: PUB, type: "support" });

    expect(result.ok && result.value).toBe("removed");
    expect(await repo.findReactionByUser(PUB, USER)).toBeNull();
  });

  it("troca quando o tipo é diferente (E1)", async () => {
    const repo = makeRepo();
    const useCase = new ToggleReaction(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    await useCase.execute({ publicationId: PUB, type: "support" });
    const result = await useCase.execute({ publicationId: PUB, type: "oppose" });

    expect(result.ok && result.value).toBe("switched");
    expect((await repo.findReactionByUser(PUB, USER))?.type).toBe("oppose");
  });

  it("exige sessão e e-mail confirmado (E8/P3)", async () => {
    const repo = makeRepo();
    const publications = publicationStateOf(PUBLIC_STATE);

    const anonymous = new ToggleReaction(sessionOf(null), publications, repo);
    expect((await anonymous.execute({ publicationId: PUB, type: "support" })).ok).toBe(
      false,
    );

    const unconfirmed = new ToggleReaction(
      sessionOf({ userId: USER, emailConfirmed: false }),
      publications,
      repo,
    );
    expect(
      (await unconfirmed.execute({ publicationId: PUB, type: "support" })).ok,
    ).toBe(false);
  });

  it("rejeita publicação apagada/oculta (E2/P9)", async () => {
    const repo = makeRepo();
    const useCase = new ToggleReaction(
      sessionOf(CONFIRMED),
      publicationStateOf({
        authorId: PUBLICATION_AUTHOR,
        deletedAt: new Date(),
        hiddenAt: null,
      }),
      repo,
    );

    expect((await useCase.execute({ publicationId: PUB, type: "support" })).ok).toBe(
      false,
    );
  });

  it("rejeita tipo inválido", async () => {
    const repo = makeRepo();
    const useCase = new ToggleReaction(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    expect((await useCase.execute({ publicationId: PUB, type: "like" })).ok).toBe(false);
  });
});

describe("AddComment (E2/E3/E4)", () => {
  it("cria comentário identificado e registra evento ao autor", async () => {
    const repo = makeRepo();
    const useCase = new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    const result = await useCase.execute({
      publicationId: PUB,
      content: "Ótima ideia, apoio!",
      isAnonymous: false,
    });

    expect(result.ok).toBe(true);
  });

  it("rejeita conteúdo fora de 2–2.000 (E3)", async () => {
    const repo = makeRepo();
    const useCase = new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    expect((await useCase.execute({ publicationId: PUB, content: "a", isAnonymous: false })).ok).toBe(
      false,
    );
  });

  it("aceita comentário anônimo (E4)", async () => {
    const repo = makeRepo();
    const useCase = new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    const result = await useCase.execute({
      publicationId: PUB,
      content: "Prefiro não me identificar",
      isAnonymous: true,
    });

    expect(result.ok).toBe(true);
  });

  it("rejeita publicação inexistente/apagada (E2)", async () => {
    const repo = makeRepo();
    const useCase = new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(null),
      repo,
    );

    expect(
      (await useCase.execute({ publicationId: PUB, content: "texto válido", isAnonymous: false })).ok,
    ).toBe(false);
  });
});

describe("EditMyComment / DeleteMyComment (E5)", () => {
  it("edita o próprio comentário dentro da janela", async () => {
    const repo = makeRepo();
    const created = await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto inicial", isAnonymous: false });

    const commentId = created.ok ? created.value.id : "";
    const useCase = new EditMyComment(sessionOf(CONFIRMED), repo);
    const result = await useCase.execute({ commentId, content: "texto corrigido" });

    expect(result.ok).toBe(true);
    expect((await repo.findCommentById(commentId))?.content).toBe("texto corrigido");
  });

  it("não edita comentário de outro autor", async () => {
    const repo = makeRepo();
    const created = await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto inicial", isAnonymous: false });

    const commentId = created.ok ? created.value.id : "";
    const useCase = new EditMyComment(
      sessionOf({ userId: OTHER, emailConfirmed: true }),
      repo,
    );

    expect((await useCase.execute({ commentId, content: "sequestro" })).ok).toBe(false);
  });

  it("apaga logicamente o próprio comentário", async () => {
    const repo = makeRepo();
    const created = await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto inicial", isAnonymous: false });

    const commentId = created.ok ? created.value.id : "";
    const useCase = new DeleteMyComment(sessionOf(CONFIRMED), repo);
    const result = await useCase.execute({ commentId });

    expect(result.ok).toBe(true);
    expect((await repo.findCommentById(commentId))?.deleted_at).not.toBeNull();
  });

  it("não apaga comentário de outro autor", async () => {
    const repo = makeRepo();
    const created = await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto inicial", isAnonymous: false });

    const commentId = created.ok ? created.value.id : "";
    const useCase = new DeleteMyComment(
      sessionOf({ userId: OTHER, emailConfirmed: true }),
      repo,
    );

    expect((await useCase.execute({ commentId })).ok).toBe(false);
  });
});

describe("ListPublicationComments (E4/E5)", () => {
  it("resolve autores e marca permissões do dono", async () => {
    const repo = makeRepo();
    await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto identificado", isAnonymous: false });

    const authors = {
      findPublicAuthors: vi.fn().mockResolvedValue(
        new Map([
          [USER, { username: "ana", fullName: "Ana Souza", avatarPath: null, isVerified: false, verifiedOrg: null }],
        ]),
      ),
    };

    const useCase = new ListPublicationComments(repo, authors);
    const { items } = await useCase.execute(PUB, { viewerId: USER });

    expect(items).toHaveLength(1);
    expect(items[0].author?.fullName).toBe("Ana Souza");
    expect(items[0].isMine).toBe(true);
    expect(items[0].canEdit).toBe(true);
  });

  it("não expõe autor de comentário anônimo (E4/P4)", async () => {
    const repo = makeRepo();
    await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto anonimo aqui", isAnonymous: true });

    const authors = {
      findPublicAuthors: vi.fn().mockResolvedValue(new Map()),
    };

    const useCase = new ListPublicationComments(repo, authors);
    const { items } = await useCase.execute(PUB);

    expect(items).toHaveLength(1);
    expect(items[0].authorId).toBeNull();
    expect(items[0].author).toBeNull();
    expect(items[0].isMine).toBe(false);
  });

  it("não marca edição para comentário antigo (E5)", async () => {
    const repo = makeRepo();
    const created = await new AddComment(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    ).execute({ publicationId: PUB, content: "texto antigo", isAnonymous: false });

    // Força created_at 20 minutos no passado (a janela é de 15 min).
    const row = await repo.findCommentById(created.ok ? created.value.id : "");
    if (row) {
      row.created_at = new Date(Date.now() - 20 * 60_000).toISOString();
    }

    const useCase = new ListPublicationComments(repo, {
      findPublicAuthors: vi.fn().mockResolvedValue(new Map()),
    });

    const { items } = await useCase.execute(PUB, {
      viewerId: USER,
      now: new Date(),
    });

    expect(items[0].isMine).toBe(true);
    expect(items[0].canEdit).toBe(false);
  });
});

describe("SavePublication (E6)", () => {
  it("salva e remove de forma idempotente", async () => {
    const repo = makeRepo();
    const save = new SavePublication(
      sessionOf(CONFIRMED),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );
    const unsave = new UnsavePublication(sessionOf(CONFIRMED), repo);

    expect((await save.execute({ publicationId: PUB })).ok).toBe(true);
    expect((await save.execute({ publicationId: PUB })).ok).toBe(true);
    expect(await repo.isBookmarked(PUB, USER)).toBe(true);

    expect((await unsave.execute({ publicationId: PUB })).ok).toBe(true);
    expect(await repo.isBookmarked(PUB, USER)).toBe(false);
  });

  it("exige sessão", async () => {
    const repo = makeRepo();
    const save = new SavePublication(
      sessionOf(null),
      publicationStateOf(PUBLIC_STATE),
      repo,
    );

    expect((await save.execute({ publicationId: PUB })).ok).toBe(false);
  });
});
