import { describe, expect, it } from "vitest";

import type { Profile } from "../domain/profile";
import { ListMyBadgeRequest, RequestBadge } from "./use-cases";
import type {
  AuthGateway,
  BadgeRequestRepository,
  BadgeRequestRow,
  ProfileRepository,
} from "./ports";

const ME = "u1";

const SESSION = { userId: ME, email: "ana@minhacidade.dev", emailConfirmed: true };

const VALID_INPUT = {
  orgName: "Secretaria de Meio Ambiente",
  evidenceUrl: "https://cariacica.es.gov.br/meio-ambiente",
};

function authOf(session: typeof SESSION | null): AuthGateway {
  return {
    currentSession: async () => session,
    signInWithPassword: async () => {},
    signUp: async () => ({ userId: ME, needsEmailConfirmation: false }),
    signInWithGoogle: async () => "",
    exchangeCodeForSession: async () => {},
    signOut: async () => {},
    verifyPassword: async () => true,
    deleteUser: async () => {},
  };
}

/** Perfil mínimo: o caso de uso só precisa do selo (I5). */
function profileOf(isVerified: boolean): Profile {
  return { isVerified } as unknown as Profile;
}

function profilesOf(isVerified: boolean): ProfileRepository {
  return {
    findPublicViewByUsername: async () => null,
    findPublicViewsByIds: async () => [],
    listPublicViewsByNeighborhood: async () => [],
    listPublicViews: async () => [],
    findById: async () => profileOf(isVerified),
    updateEditableFields: async () => {},
    usernameExists: async () => false,
    deleteById: async () => {},
  };
}

function makeRequests() {
  const rows: BadgeRequestRow[] = [];
  const events: { name: string }[] = [];

  const repository: BadgeRequestRepository = {
    async create(input) {
      rows.push({
        id: input.id,
        user_id: input.userId,
        org_name: input.orgName,
        evidence_url: input.evidenceUrl,
        evidence_email: input.evidenceEmail,
        message: input.message,
        status: "pending",
        decided_by: null,
        decided_at: null,
        decision_reason: null,
        created_at: new Date().toISOString(),
      });
    },
    async findPendingByUserId(userId) {
      return rows.find((row) => row.user_id === userId && row.status === "pending") ?? null;
    },
    async findLatestByUserId(userId) {
      return [...rows].reverse().find((row) => row.user_id === userId) ?? null;
    },
    async recordEvent(event) {
      events.push({ name: event.name });
    },
  };

  return { repository, rows, events };
}

describe("RequestBadge (P13/B2)", () => {
  it("cria a solicitação pendente e registra o evento", async () => {
    const { repository, rows, events } = makeRequests();

    const result = await new RequestBadge(authOf(SESSION), profilesOf(false), repository).execute(
      VALID_INPUT,
    );

    expect(result.ok).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user_id: ME,
      org_name: "Secretaria de Meio Ambiente",
      status: "pending",
      evidence_url: "https://cariacica.es.gov.br/meio-ambiente",
    });
    expect(events).toEqual([{ name: "identity.badge_requested" }]);
  });

  it("recusa sem sessão", async () => {
    const { repository, rows } = makeRequests();

    const result = await new RequestBadge(authOf(null), profilesOf(false), repository).execute(
      VALID_INPUT,
    );

    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("recusa e-mail não confirmado (I9)", async () => {
    const { repository, rows } = makeRequests();

    const result = await new RequestBadge(
      authOf({ ...SESSION, emailConfirmed: false }),
      profilesOf(false),
      repository,
    ).execute(VALID_INPUT);

    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("recusa quem já tem o selo (I5)", async () => {
    const { repository, rows } = makeRequests();

    const result = await new RequestBadge(authOf(SESSION), profilesOf(true), repository).execute(
      VALID_INPUT,
    );

    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("recusa nome de órgão inválido (VO VerifiedOrg)", async () => {
    const { repository, rows } = makeRequests();

    const result = await new RequestBadge(authOf(SESSION), profilesOf(false), repository).execute({
      ...VALID_INPUT,
      orgName: "SE",
    });

    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("recusa evidência que não é link http(s)", async () => {
    const { repository, rows } = makeRequests();

    const result = await new RequestBadge(authOf(SESSION), profilesOf(false), repository).execute({
      ...VALID_INPUT,
      evidenceUrl: "cariacica.es.gov.br/meio-ambiente",
    });

    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("recusa e-mail de contato inválido", async () => {
    const { repository, rows } = makeRequests();

    const result = await new RequestBadge(authOf(SESSION), profilesOf(false), repository).execute({
      ...VALID_INPUT,
      evidenceEmail: "nao-e-email",
    });

    expect(result.ok).toBe(false);
    expect(rows).toHaveLength(0);
  });

  it("recusa segunda solicitação enquanto uma está pendente", async () => {
    const { repository, rows } = makeRequests();
    const useCase = new RequestBadge(authOf(SESSION), profilesOf(false), repository);

    expect((await useCase.execute(VALID_INPUT)).ok).toBe(true);

    const second = await useCase.execute({ ...VALID_INPUT, orgName: "Outro orgão" });

    expect(second.ok).toBe(false);
    expect(rows).toHaveLength(1);
  });
});

describe("ListMyBadgeRequest (P13/B2)", () => {
  it("devolve null quando não há pedido", async () => {
    const { repository } = makeRequests();

    const result = await new ListMyBadgeRequest(authOf(SESSION), repository).execute();

    expect(result.ok && result.value === null).toBe(true);
  });

  it("devolve o estado pendente do pedido", async () => {
    const { repository } = makeRequests();
    await new RequestBadge(authOf(SESSION), profilesOf(false), repository).execute(VALID_INPUT);

    const result = await new ListMyBadgeRequest(authOf(SESSION), repository).execute();

    expect(result.ok && result.value?.status === "pending").toBe(true);
    expect(result.ok && result.value?.orgName).toBe("Secretaria de Meio Ambiente");
  });

  it("recusa sem sessão", async () => {
    const { repository } = makeRequests();

    const result = await new ListMyBadgeRequest(authOf(null), repository).execute();

    expect(result.ok).toBe(false);
  });
});
