import { describe, expect, it, vi } from "vitest";

import {
  AcceptFriendRequest,
  CancelFriendRequest,
  CountFriends,
  DiscoverRandomPeople,
  GetRelationshipForViewer,
  ListFriends,
  ListIncomingFriendRequests,
  ListOutgoingFriendRequests,
  RejectFriendRequest,
  SearchProfiles,
  SendFriendRequest,
  SuggestFriends,
  Unfriend,
} from "./use-cases";
import type {
  CurrentSocialGraphSessionPort,
  FriendshipRepository,
  FriendshipRow,
  PersonCard,
  ProfileLookup,
  SocialGraphSession,
} from "./ports";

const ME = "u1";
const OTHER = "u2";
const THIRD = "u3";

const CONFIRMED: SocialGraphSession = { userId: ME, emailConfirmed: true };

const CATALOG: PersonCard[] = [
  {
    id: OTHER,
    username: "ana-souza",
    fullName: "Ana Souza",
    avatarPath: null,
    isVerified: false,
    verifiedOrg: null,
    cityId: 3201308,
    neighborhoodId: "n1",
  },
  {
    id: THIRD,
    username: "bruno-costa",
    fullName: "Bruno Costa",
    avatarPath: null,
    isVerified: true,
    verifiedOrg: "Secretaria de Obras",
    cityId: 3201308,
    neighborhoodId: "n1",
  },
  {
    id: "u4",
    username: "fernanda-alves",
    fullName: "Fernanda Alves",
    avatarPath: null,
    isVerified: false,
    verifiedOrg: null,
    cityId: 3205309,
    neighborhoodId: null,
  },
];

const profiles: ProfileLookup = {
  findProfileIdByUsername: vi.fn(async (username: string) =>
    username === OTHER ? OTHER : username === THIRD ? THIRD : null,
  ),
  findPublicProfile: vi.fn(async (id: string) => ({
    id,
    username: `user-${id}`,
    fullName: `Usuário ${id}`,
    avatarPath: null,
    isVerified: false,
    verifiedOrg: null,
  })),
  searchPublicProfiles: vi.fn(async (term: string, options: { limit?: number } = {}) => {
    const found = CATALOG.filter(
      (item) =>
        item.fullName.toLowerCase().includes(term.toLowerCase()) ||
        item.username.includes(term.toLowerCase()),
    );
    return found.slice(0, options.limit ?? 20);
  }),
  findOwnNeighborhoodId: vi.fn(async (userId: string) => (userId === ME ? "n1" : null)),
  listPeopleByNeighborhood: vi.fn(
    async (neighborhoodId: string, options: { limit: number; excludeIds?: readonly string[] }) =>
      CATALOG.filter(
        (item) =>
          item.neighborhoodId === neighborhoodId &&
          !(options.excludeIds ?? []).includes(item.id),
      ).slice(0, options.limit),
  ),
  listPeople: vi.fn(async (options: { limit: number; excludeIds?: readonly string[] }) =>
    CATALOG.filter((item) => !(options.excludeIds ?? []).includes(item.id)).slice(0, options.limit),
  ),
};

function makeRepo(initial: FriendshipRow[] = []): FriendshipRepository {
  const rows = new Map<string, FriendshipRow>(initial.map((row) => [row.id, { ...row }]));
  const events: Record<string, unknown>[] = [];

  const lowest = (a: string, b: string) => (a < b ? a : b);

  return {
    async findByPair(userId, otherId) {
      const low = lowest(userId, otherId);
      const high = low === userId ? otherId : userId;

      return (
        [...rows.values()].find(
          (row) => row.user_low === low && row.user_high === high,
        ) ?? null
      );
    },
    async createRequest(input) {
      const low = lowest(input.requesterId, input.otherId);
      const high = low === input.requesterId ? input.otherId : input.requesterId;

      rows.set(input.id, {
        id: input.id,
        user_low: low,
        user_high: high,
        status: "pending",
        requested_by: input.requesterId,
        responded_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    async accept(rowId, responderId) {
      const row = rows.get(rowId);

      if (row) {
        row.status = "accepted";
        row.responded_by = responderId;
        row.updated_at = new Date().toISOString();
      }
    },
    async remove(rowId) {
      rows.delete(rowId);
    },
    async listFriends(userId, options) {
      const limit = options.limit;
      const accepted = [...rows.values()]
        .filter((row) => row.status === "accepted")
        .filter((row) => row.user_low === userId || row.user_high === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      const page = accepted.slice(0, limit);

      return { rows: page, nextCursor: null };
    },
    async listIncomingRequests(userId) {
      return [...rows.values()].filter(
        (row) => row.status === "pending" && row.requested_by !== userId &&
          (row.user_low === userId || row.user_high === userId),
      );
    },
    async listOutgoingRequests(userId) {
      return [...rows.values()].filter(
        (row) => row.status === "pending" && row.requested_by === userId,
      );
    },
    async countFriends(userId) {
      return [...rows.values()].filter(
        (row) =>
          row.status === "accepted" &&
          (row.user_low === userId || row.user_high === userId),
      ).length;
    },
    async recordEvent(event) {
      events.push(event);
    },
  } as FriendshipRepository & { __events?: unknown[] };
}

function sessionOf(session: SocialGraphSession | null): CurrentSocialGraphSessionPort {
  return vi.fn().mockResolvedValue(session) as CurrentSocialGraphSessionPort;
}

function row(overrides: Partial<FriendshipRow> = {}): FriendshipRow {
  return {
    id: "f1",
    user_low: ME,
    user_high: OTHER,
    status: "pending",
    requested_by: ME,
    responded_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("SendFriendRequest (S2/S3)", () => {
  it("cria pedido para quem não tem vínculo", async () => {
    const repo = makeRepo();
    const useCase = new SendFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    const result = await useCase.execute({ username: "u2" });

    expect(result.ok).toBe(true);
    expect(await repo.findByPair(ME, OTHER)).not.toBeNull();
  });

  it("rejeita vínculo duplicado (S2)", async () => {
    const repo = makeRepo([row()]);
    const useCase = new SendFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(false);
  });

  it("rejeita autorelacionamento (S3)", async () => {
    const repo = makeRepo();
    const useCase = new SendFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: ME })).ok).toBe(false);
  });

  it("exige e-mail confirmado (P3)", async () => {
    const repo = makeRepo();
    const useCase = new SendFriendRequest(
      sessionOf({ userId: ME, emailConfirmed: false }),
      profiles,
      repo,
    );

    expect((await useCase.execute({ username: "u2" })).ok).toBe(false);
  });
});

describe("CancelFriendRequest (S5)", () => {
  it("cancela sendo o remetente", async () => {
    const repo = makeRepo([row()]);
    const useCase = new CancelFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(true);
    expect(await repo.findByPair(ME, OTHER)).toBeNull();
  });

  it("não cancela pedido de outra pessoa (S5)", async () => {
    const repo = makeRepo([row({ requested_by: OTHER })]);
    const useCase = new CancelFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(false);
    expect(await repo.findByPair(ME, OTHER)).not.toBeNull();
  });
});

describe("AcceptFriendRequest / RejectFriendRequest (S4)", () => {
  it("aceita sendo o destinatário", async () => {
    const repo = makeRepo([row({ requested_by: OTHER })]);
    const useCase = new AcceptFriendRequest(
      sessionOf(CONFIRMED),
      profiles,
      repo,
    );

    expect((await useCase.execute({ username: "u2" })).ok).toBe(true);
    expect((await repo.findByPair(ME, OTHER))?.status).toBe("accepted");
  });

  it("não aceita sendo o remetente (S4)", async () => {
    const repo = makeRepo([row()]);
    const useCase = new AcceptFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(false);
  });

  it("recusa sendo o destinatário", async () => {
    const repo = makeRepo([row({ requested_by: OTHER })]);
    const useCase = new RejectFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(true);
    expect(await repo.findByPair(ME, OTHER)).toBeNull();
  });

  it("não recusa sendo o remetente (S4)", async () => {
    const repo = makeRepo([row()]);
    const useCase = new RejectFriendRequest(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(false);
  });
});

describe("Unfriend (S6)", () => {
  it("desfaz amizade por qualquer lado", async () => {
    const repo = makeRepo([
      row({ status: "accepted", responded_by: OTHER }),
    ]);
    const useCase = new Unfriend(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(true);
    expect(await repo.findByPair(ME, OTHER)).toBeNull();
  });

  it("não desfaz quando não há amizade aceita", async () => {
    const repo = makeRepo([row()]);
    const useCase = new Unfriend(sessionOf(CONFIRMED), profiles, repo);

    expect((await useCase.execute({ username: "u2" })).ok).toBe(false);
  });
});

describe("Listas e estado (S1)", () => {
  it("amigos aceitos aparecem para os dois lados", async () => {
    const repo = makeRepo([row({ status: "accepted", responded_by: OTHER })]);

    const mine = await new ListFriends(profiles, repo).execute(ME);
    const theirs = await new ListFriends(profiles, repo).execute(OTHER);

    expect(mine.items).toHaveLength(1);
    expect(theirs.items).toHaveLength(1);
    expect(mine.items[0].id).toBe(OTHER);
    expect(theirs.items[0].id).toBe(ME);
  });

  it("conta amigos", async () => {
    const repo = makeRepo([row({ status: "accepted", responded_by: OTHER })]);

    expect(await new CountFriends(repo).execute(ME)).toBe(1);
    expect(await new CountFriends(repo).execute(THIRD)).toBe(0);
  });

  it("estado visto pelo visitante", async () => {
    const repo = makeRepo([row({ requested_by: OTHER })]);

    const relationship = await new GetRelationshipForViewer(
      sessionOf(CONFIRMED),
      repo,
    ).execute(OTHER);

    expect(relationship).toBe("pending_received");
  });

  it("solicitações recebidas só trazem o destinatário", async () => {
    const repo = makeRepo([row(), row({ id: "f2", requested_by: OTHER })]);
    const incoming = await new ListIncomingFriendRequests(profiles, repo).execute(ME);

    expect(incoming).toHaveLength(1);
    expect(incoming[0].requesterId).toBe(OTHER);
  });
});

describe("SearchProfiles (T3)", () => {
  it("encontra por @username", async () => {
    const result = await new SearchProfiles(profiles).execute("ana");

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.map((item) => item.username)).toEqual(["ana-souza"]);
  });

  it("encontra por nome sem diferenciar caixa", async () => {
    const result = await new SearchProfiles(profiles).execute("BRUNO");

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toHaveLength(1);
  });

  it("recusa termo com menos de 2 caracteres", async () => {
    const result = await new SearchProfiles(profiles).execute("a");

    expect(result.ok).toBe(false);
  });

  it("devolve lista vazia quando não há correspondência", async () => {
    const result = await new SearchProfiles(profiles).execute("ninguem");

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual([]);
  });

  it("respeita o limite pedido", async () => {
    const found = await new SearchProfiles(profiles).execute("an");
    const limited = await new SearchProfiles(profiles).execute("an", { limit: 1 });

    expect(found.ok && found.value).toHaveLength(2);
    expect(limited.ok && limited.value).toHaveLength(1);
  });
});

// ------------------------------------------- descoberta e sugestões (S3)

describe("SuggestFriends (S3/D-6)", () => {
  it("sugere pessoas do mesmo bairro", async () => {
    const useCase = new SuggestFriends(sessionOf(CONFIRMED), profiles, makeRepo());

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.map((person) => person.id).sort()).toEqual([OTHER, THIRD]);
  });

  it("exclui amigos aceitos", async () => {
    const repo = makeRepo([row({ status: "accepted", responded_by: OTHER })]);
    const useCase = new SuggestFriends(sessionOf(CONFIRMED), profiles, repo);

    const result = await useCase.execute();

    expect(result.ok && result.value.map((person) => person.id)).toEqual([THIRD]);
  });

  it("exclui pedidos pendentes nos dois sentidos", async () => {
    const pendenteRecebido = row({
      id: "f2",
      user_low: ME,
      user_high: THIRD,
      requested_by: THIRD,
    });
    const useCase = new SuggestFriends(sessionOf(CONFIRMED), profiles, makeRepo([pendenteRecebido]));

    const result = await useCase.execute();

    expect(result.ok && result.value.map((person) => person.id)).toEqual([OTHER]);
  });

  it("sem bairro próprio não sugere ninguém (convite na tela)", async () => {
    const semBairro: ProfileLookup = {
      ...profiles,
      findOwnNeighborhoodId: vi.fn(async () => null),
    };
    const useCase = new SuggestFriends(sessionOf(CONFIRMED), semBairro, makeRepo());

    const result = await useCase.execute();

    expect(result.ok && result.value).toEqual([]);
  });

  it("recusa sem sessão", async () => {
    const useCase = new SuggestFriends(sessionOf(null), profiles, makeRepo());

    expect((await useCase.execute()).ok).toBe(false);
  });
});

describe("DiscoverRandomPeople (S3/D-6)", () => {
  it("lista a plataforma inteira com o limite pedido", async () => {
    const useCase = new DiscoverRandomPeople(sessionOf(CONFIRMED), profiles, makeRepo());

    const result = await useCase.execute({ limit: 5 });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toHaveLength(3);
  });

  it("respeita o exclude acumulado (pular)", async () => {
    const useCase = new DiscoverRandomPeople(sessionOf(CONFIRMED), profiles, makeRepo());

    const result = await useCase.execute({ limit: 5, exclude: [OTHER, THIRD] });

    expect(result.ok && result.value.map((person) => person.id)).toEqual(["u4"]);
  });

  it("exclui amigos e pendentes", async () => {
    const repo = makeRepo([row({ status: "accepted", responded_by: OTHER })]);
    const useCase = new DiscoverRandomPeople(sessionOf(CONFIRMED), profiles, repo);

    const result = await useCase.execute();

    expect(result.ok && result.value.map((person) => person.id).sort()).toEqual([THIRD, "u4"]);
  });

  it("teto de 20 exclusões por consulta", async () => {
    const useCase = new DiscoverRandomPeople(sessionOf(CONFIRMED), profiles, makeRepo());
    const muitos = Array.from({ length: 25 }, (_, i) => `x${i}`);

    const result = await useCase.execute({ exclude: muitos });

    // Os 20 primeiros do exclude não entram na query; o catálogo segue íntegro.
    expect(result.ok && result.value).toHaveLength(3);
  });
});

describe("ListOutgoingFriendRequests (S4)", () => {
  it("lista os pedidos enviados pendentes", async () => {
    const repo = makeRepo([row()]);

    const result = await new ListOutgoingFriendRequests(profiles, repo).execute(ME);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ targetId: OTHER, username: "user-u2" });
  });

  it("não lista o que foi aceito", async () => {
    const repo = makeRepo([row({ status: "accepted", responded_by: OTHER })]);

    const result = await new ListOutgoingFriendRequests(profiles, repo).execute(ME);

    expect(result).toEqual([]);
  });
});
