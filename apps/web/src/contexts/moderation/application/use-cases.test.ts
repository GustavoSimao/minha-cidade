import { describe, expect, it, vi } from "vitest";

import {
  ApplyModerationAction,
  ApproveBadgeRequest,
  DemoteModerator,
  EnforceRateLimit,
  GrantBadge,
  ListBadgeRequests,
  ListModerationActions,
  PromoteModerator,
  RejectBadgeRequest,
  ReportContent,
  RevokeBadge,
} from "./use-cases";
import type {
  BadgeRequestAdmin,
  BadgeRequestDirectory,
  BadgeRequestQueueItem,
  CurrentModerationSessionPort,
  ModerationRepository,
  ProfileAdminPort,
  ProfileLookupPort,
  ProfileSummary,
  ReportRow,
  ReportableType,
  RoleDirectory,
  TargetDirectory,
  TargetVisibilityPort,
  UserRole,
} from "./ports";

const ME = "u1";
const OTHER = "u2";
const STAFF = "u3";
const PUB = "p1";
const COMMENT = "c1";

const CONFIRMED = { userId: ME, emailConfirmed: true };
const STAFF_SESSION = { userId: STAFF, emailConfirmed: true };

const publication = {
  id: PUB,
  title: "Titulo da publicacao",
  content: "Conteudo de teste com mais de dez caracteres.",
  authorId: OTHER,
  isAnonymous: false,
  hiddenAt: null,
  deletedAt: null,
};

const comment = {
  id: COMMENT,
  publicationId: PUB,
  content: "Comentario de teste",
  authorId: OTHER,
  isAnonymous: false,
  hiddenAt: null,
  deletedAt: null,
};

function makeReports(): ModerationRepository {
  const reportRows: ReportRow[] = [];
  const actions: Record<string, unknown>[] = [];
  const limits = new Map<string, number>();

  return {
    async findReportByUserAndTarget(userId, type, id) {
      return (
        reportRows.find(
          (row) =>
            row.reporter_id === userId &&
            row.reportable_type === type &&
            row.reportable_id === id,
        ) ?? null
      );
    },
    async countReportsByTarget(type, id) {
      return reportRows.filter(
        (row) => row.reportable_type === type && row.reportable_id === id,
      ).length;
    },
    async createReport(input) {
      reportRows.push({
        id: input.id,
        reporter_id: input.reporterId,
        reportable_type: input.reportableType,
        reportable_id: input.reportableId,
        reason: input.reason,
        details: input.details,
        created_at: new Date().toISOString(),
      });
    },
    async listQueue(options) {
      const grouped = new Map<string, { type: ReportableType; id: string; count: number; reasons: string[]; latest: string }>();

      for (const row of reportRows) {
        const key = `${row.reportable_type}:${row.reportable_id}`;
        const entry = grouped.get(key) ?? {
          type: row.reportable_type,
          id: row.reportable_id,
          count: 0,
          reasons: [],
          latest: row.created_at,
        };
        entry.count += 1;
        entry.reasons.push(row.reason);
        entry.latest = row.created_at > entry.latest ? row.created_at : entry.latest;
        grouped.set(key, entry);
      }

      void options;

      return [];
    },
    async listReportsByTarget(type, id) {
      return reportRows.filter(
        (row) => row.reportable_type === type && row.reportable_id === id,
      );
    },
    async listActions(options) {
      void options;
      return actions as never[];
    },
    async recordAction(action) {
      actions.push(action);
    },
    async countInWindow(subject, scope, window, windowStart) {
      return limits.get(`${subject.type}:${subject.id}:${scope}:${window}:${windowStart.toISOString()}`) ?? 0;
    },
    async incrementInWindow(subject, scope, window, windowStart) {
      const key = `${subject.type}:${subject.id}:${scope}:${window}:${windowStart.toISOString()}`;
      limits.set(key, (limits.get(key) ?? 0) + 1);
    },
    async recordEvent() {},
  } as ModerationRepository & { __actions?: unknown[]; __reports?: ReportRow[] };
}

function sessionOf(session: { userId: string; emailConfirmed: boolean } | null): CurrentModerationSessionPort {
  return vi.fn().mockResolvedValue(session) as CurrentModerationSessionPort;
}

const targets: TargetDirectory = {
  findPublication: vi.fn(async (id: string) => (id === PUB ? publication : null)),
  findComment: vi.fn(async (id: string) => (id === COMMENT ? comment : null)),
};

const roles: RoleDirectory = {
  findRole: vi.fn(async (userId: string) =>
    userId === STAFF ? "admin" : "user",
  ) as RoleDirectory["findRole"],
};

const visibility: TargetVisibilityPort = {
  hidePublication: vi.fn().mockResolvedValue(undefined),
  restorePublication: vi.fn().mockResolvedValue(undefined),
  removePublication: vi.fn().mockResolvedValue(undefined),
  hideComment: vi.fn().mockResolvedValue(undefined),
  restoreComment: vi.fn().mockResolvedValue(undefined),
  removeComment: vi.fn().mockResolvedValue(undefined),
};

const VALID_COMMENT_CONTENT = "Conteudo de teste com mais de dez caracteres.";

describe("ReportContent (M1–M4/M8/M9)", () => {
  it("cria denúncia em conteúdo de outra pessoa", async () => {
    const reports = makeReports();
    const useCase = new ReportContent(sessionOf(CONFIRMED), reports, targets, reports);

    const result = await useCase.execute({
      reportableType: "publication",
      targetId: PUB,
      reason: "spam",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.reportsCount).toBe(1);
    }
  });

  it("exige sessão confirmada (M1)", async () => {
    const reports = makeReports();
    const useCase = new ReportContent(sessionOf(null), reports, targets, reports);

    expect(
      (await useCase.execute({ reportableType: "publication", targetId: PUB, reason: "spam" })).ok,
    ).toBe(false);
  });

  it("não permite denunciar duas vezes o mesmo alvo (M2)", async () => {
    const reports = makeReports();
    const useCase = new ReportContent(sessionOf(CONFIRMED), reports, targets, reports);

    await useCase.execute({ reportableType: "publication", targetId: PUB, reason: "spam" });
    const second = await useCase.execute({
      reportableType: "publication",
      targetId: PUB,
      reason: "spam",
    });

    expect(second.ok).toBe(false);
  });

  it("não permite denunciar o próprio conteúdo (M8)", async () => {
    const reports = makeReports();
    const selfishTargets: TargetDirectory = {
      findPublication: vi.fn(async (id: string) =>
        id === PUB ? { ...publication, authorId: ME } : null,
      ),
      findComment: vi.fn(async () => null),
    };
    const useCase = new ReportContent(sessionOf(CONFIRMED), reports, selfishTargets, reports);

    expect(
      (await useCase.execute({ reportableType: "publication", targetId: PUB, reason: "spam" })).ok,
    ).toBe(false);
  });

  it("rejeita motivo fora do conjunto (M3)", async () => {
    const reports = makeReports();
    const useCase = new ReportContent(sessionOf(CONFIRMED), reports, targets, reports);

    expect(
      (await useCase.execute({ reportableType: "publication", targetId: PUB, reason: "xingamento" })).ok,
    ).toBe(false);
  });

  it("bloqueia acima do limite diário de denúncias (M9)", async () => {
    const reports = makeReports();
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < 10; i += 1) {
      await reports.incrementInWindow({ type: "user", id: ME }, "report", "day", windowStart);
    }

    const useCase = new ReportContent(sessionOf(CONFIRMED), reports, targets, reports);

    expect(
      (await useCase.execute({ reportableType: "publication", targetId: PUB, reason: "spam" })).ok,
    ).toBe(false);
  });
});

describe("EnforceRateLimit (M9/P16)", () => {
  it("bloqueia na 6ª publicação da hora", async () => {
    const limits = makeReports();
    const useCase = new EnforceRateLimit(sessionOf(CONFIRMED), limits);

    for (let i = 0; i < 5; i += 1) {
      expect((await useCase.execute("publication")).ok).toBe(true);
    }

    expect((await useCase.execute("publication")).ok).toBe(false);
  });

  it("hora e dia não compartilham contador na primeira hora do dia UTC", async () => {
    // 00:30 UTC: o início da janela horária e o da janela diária coincidem
    // (meia-noite). Sem a coluna `window` na chave do contador, os dois
    // limites dividiam a mesma linha e a 4ª publicação já era bloqueada.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T00:30:00.000Z"));

    try {
      const limits = makeReports();
      const useCase = new EnforceRateLimit(sessionOf(CONFIRMED), limits);

      for (let i = 0; i < 5; i += 1) {
        expect((await useCase.execute("publication")).ok).toBe(true);
      }

      expect((await useCase.execute("publication")).ok).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("bloqueia o IP na 31ª publicação da hora (B4/ADR-0017)", async () => {
    const limits = makeReports();
    const useCase = new EnforceRateLimit(sessionOf(CONFIRMED), limits, { ip: async () => "203.0.113.7" });
    const windowStart = new Date();
    windowStart.setUTCMinutes(0, 0, 0);

    // 5 publicações é o teto do usuário — usa outro usuário por rodada para
    // isolar o teto por IP.
    for (let i = 0; i < 30; i += 1) {
      await limits.incrementInWindow({ type: "ip", id: "203.0.113.7" }, "publication", "hour", windowStart);
    }

    // O usuário ainda pode publicar (teto dele é outro) — mas o IP já está no teto.
    const result = await useCase.execute("publication");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("por IP");
    }
  });

  it("sem IP (proxy não confiável) só vale o teto do usuário", async () => {
    const limits = makeReports();
    const useCase = new EnforceRateLimit(sessionOf(CONFIRMED), limits, { ip: async () => null });

    expect((await useCase.execute("publication")).ok).toBe(true);
  });

  it("comentários têm teto de 20 por hora", async () => {
    const limits = makeReports();
    const useCase = new EnforceRateLimit(sessionOf(CONFIRMED), limits);
    const windowStart = new Date();
    windowStart.setUTCMinutes(0, 0, 0);

    for (let i = 0; i < 20; i += 1) {
      await limits.incrementInWindow({ type: "user", id: ME }, "comment", "hour", windowStart);
    }

    expect((await useCase.execute("comment")).ok).toBe(false);
  });
});

describe("ApplyModerationAction (M5/M7)", () => {
  it("staff oculta e registra na trilha", async () => {
    const reports = makeReports();
    const useCase = new ApplyModerationAction(
      sessionOf(STAFF_SESSION),
      roles,
      reports,
      targets,
      visibility,
    );

    const result = await useCase.execute({
      action: "hide",
      targetType: "publication",
      targetId: PUB,
      reason: "spam repetido",
    });

    expect(result.ok).toBe(true);
    expect(visibility.hidePublication).toHaveBeenCalledOnce();
  });

  it("usuário comum não age (M5)", async () => {
    const reports = makeReports();
    const useCase = new ApplyModerationAction(
      sessionOf(CONFIRMED),
      roles,
      reports,
      targets,
      visibility,
    );

    expect(
      (await useCase.execute({ action: "hide", targetType: "publication", targetId: PUB })).ok,
    ).toBe(false);
  });

  it("moderador comum não remove (M5 — remove é admin)", async () => {
    const reports = makeReports();
    const modOnly: RoleDirectory = {
      findRole: vi.fn(async () => "moderator" as const),
    };
    const useCase = new ApplyModerationAction(
      sessionOf(STAFF_SESSION),
      modOnly,
      reports,
      targets,
      visibility,
    );

    expect(
      (await useCase.execute({ action: "remove", targetType: "publication", targetId: PUB })).ok,
    ).toBe(false);
  });

  it("restaurar só faz sentido em conteúdo oculto", async () => {
    const reports = makeReports();
    const useCase = new ApplyModerationAction(
      sessionOf(STAFF_SESSION),
      roles,
      reports,
      targets,
      visibility,
    );

    expect(
      (await useCase.execute({ action: "restore", targetType: "publication", targetId: PUB })).ok,
    ).toBe(false);
  });
});

describe("ListModerationActions", () => {
  it("só staff vê a trilha", async () => {
    const reports = makeReports();
    const useCase = new ListModerationActions(
      sessionOf(CONFIRMED),
      roles,
      reports,
      targets,
    );

    expect((await useCase.execute()).ok).toBe(false);
  });
});

// ---------------------------------------------------------------- Fase 8 (B2)

const TARGET_PROFILE: ProfileSummary = {
  id: OTHER,
  username: "usuario-alvo",
  fullName: "Usuario Alvo",
  role: "user",
  verifiedOrg: null,
};

function makeProfiles(
  profile: ProfileSummary | null = TARGET_PROFILE,
): ProfileLookupPort {
  return { findByUsername: vi.fn(async () => profile) };
}

function makeAdmin(): ProfileAdminPort & { calls: string[] } {
  const calls: string[] = [];

  return {
    calls,
    async grantVerifiedOrg(profileId, orgName) {
      calls.push(`grant:${profileId}:${orgName}`);
    },
    async revokeVerifiedOrg(profileId) {
      calls.push(`revoke:${profileId}`);
    },
    async setRole(profileId, role) {
      calls.push(`role:${profileId}:${role}`);
    },
  };
}

describe("GrantBadge (B2/I5)", () => {
  it("admin concede selo e registra na trilha", async () => {
    const reports = makeReports();
    const admin = makeAdmin();
    const useCase = new GrantBadge(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles(),
      admin,
      reports,
    );

    const result = await useCase.execute({
      username: "@USUARIO-ALVO",
      orgName: "  Secretaria de Meio Ambiente ",
    });

    expect(result.ok).toBe(true);
    expect(admin.calls).toEqual([`grant:${OTHER}:Secretaria de Meio Ambiente`]);
  });

  it("recusa nome de órgão inválido (VO VerifiedOrg)", async () => {
    const useCase = new GrantBadge(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo", orgName: "ab" })).ok).toBe(
      false,
    );
  });

  it("não concede duas vezes", async () => {
    const useCase = new GrantBadge(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles({ ...TARGET_PROFILE, verifiedOrg: "Prefeitura" }),
      makeAdmin(),
      makeReports(),
    );

    expect(
      (await useCase.execute({ username: "usuario-alvo", orgName: "Outro orgão" })).ok,
    ).toBe(false);
  });

  it("usuário comum não concede", async () => {
    const useCase = new GrantBadge(
      sessionOf(CONFIRMED),
      roles,
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    );

    expect(
      (await useCase.execute({ username: "usuario-alvo", orgName: "Secretaria X" })).ok,
    ).toBe(false);
  });

  it("moderador (não admin) não concede", async () => {
    const modOnly: RoleDirectory = { findRole: vi.fn(async () => "moderator" as UserRole) };
    const useCase = new GrantBadge(
      sessionOf(STAFF_SESSION),
      modOnly,
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    );

    expect(
      (await useCase.execute({ username: "usuario-alvo", orgName: "Secretaria X" })).ok,
    ).toBe(false);
  });
});

describe("RevokeBadge (B2/I5)", () => {
  it("admin revoga selo existente", async () => {
    const admin = makeAdmin();
    const useCase = new RevokeBadge(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles({ ...TARGET_PROFILE, verifiedOrg: "Secretaria de Obras" }),
      admin,
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(true);
    expect(admin.calls).toEqual([`revoke:${OTHER}`]);
  });

  it("falta quando não há selo", async () => {
    const useCase = new RevokeBadge(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(false);
  });
});

describe("PromoteModerator (B2/M5)", () => {
  it("admin promove usuário comum", async () => {
    const admin = makeAdmin();
    const useCase = new PromoteModerator(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles(),
      admin,
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(true);
    expect(admin.calls).toEqual([`role:${OTHER}:moderator`]);
  });

  it("não promove quem já é staff", async () => {
    const useCase = new PromoteModerator(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles({ ...TARGET_PROFILE, role: "moderator" }),
      makeAdmin(),
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(false);
  });
});

describe("DemoteModerator (B2/M5)", () => {
  it("admin rebaixa moderador", async () => {
    const admin = makeAdmin();
    const useCase = new DemoteModerator(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles({ ...TARGET_PROFILE, role: "moderator" }),
      admin,
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(true);
    expect(admin.calls).toEqual([`role:${OTHER}:user`]);
  });

  it("não rebaixa a si mesmo", async () => {
    const useCase = new DemoteModerator(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles({ ...TARGET_PROFILE, role: "admin", id: STAFF }),
      makeAdmin(),
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(false);
  });

  it("não rebaixa quem já é usuário comum", async () => {
    const useCase = new DemoteModerator(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    );

    expect((await useCase.execute({ username: "usuario-alvo" })).ok).toBe(false);
  });

  it("perfil inexistente não é alterado", async () => {
    const useCase = new DemoteModerator(
      sessionOf(STAFF_SESSION),
      roles,
      makeProfiles(null),
      makeAdmin(),
      makeReports(),
    );

    expect((await useCase.execute({ username: "ninguem" })).ok).toBe(false);
  });
});

// ------------------------------------------- solicitações de selo (P13/B2)

const PENDING_REQUEST: BadgeRequestQueueItem = {
  id: "req1",
  userId: OTHER,
  username: "usuario-alvo",
  fullName: "Usuario Alvo",
  orgName: "Secretaria de Meio Ambiente",
  evidenceUrl: "https://cariacica.es.gov.br/meio-ambiente",
  evidenceEmail: null,
  message: null,
  status: "pending",
  createdAt: new Date("2026-10-15T00:00:00.000Z"),
};

function makeBadgeRequests(
  items: BadgeRequestQueueItem[] = [PENDING_REQUEST],
): BadgeRequestDirectory & { calls: string[] } {
  const calls: string[] = [];

  return {
    calls,
    async listPending(limit) {
      return items.filter((item) => item.status === "pending").slice(0, limit);
    },
    async findById(id) {
      return items.find((item) => item.id === id) ?? null;
    },
  } as BadgeRequestDirectory & { calls: string[] };
}

function makeBadgeRequestAdmin(): BadgeRequestAdmin & { calls: string[] } {
  const calls: string[] = [];

  return {
    calls,
    async markApproved(id, decidedBy) {
      calls.push(`approved:${id}:${decidedBy}`);
    },
    async markRejected(id, decidedBy, reason) {
      calls.push(`rejected:${id}:${decidedBy}:${reason}`);
    },
  } as BadgeRequestAdmin & { calls: string[] };
}

describe("ListBadgeRequests (P13/B2)", () => {
  it("staff vê a fila de pendentes", async () => {
    const requests = makeBadgeRequests();

    const result = await new ListBadgeRequests(
      sessionOf(STAFF_SESSION),
      roles,
      requests,
    ).execute();

    expect(result.ok && result.value.map((item) => item.id)).toEqual(["req1"]);
  });

  it("usuário comum não vê a fila", async () => {
    const result = await new ListBadgeRequests(
      sessionOf(CONFIRMED),
      roles,
      makeBadgeRequests(),
    ).execute();

    expect(result.ok).toBe(false);
  });
});

describe("ApproveBadgeRequest (P13/B2)", () => {
  it("admin aprova: concede o selo pelo GrantBadge e marca aprovada", async () => {
    const admin = makeAdmin();
    const requestAdmin = makeBadgeRequestAdmin();
    const requests = makeBadgeRequests();

    const result = await new ApproveBadgeRequest(
      sessionOf(STAFF_SESSION),
      roles,
      requests,
      requestAdmin,
      makeProfiles(),
      admin,
      makeReports(),
    ).execute({ requestId: "req1" });

    expect(result.ok).toBe(true);
    // Nome do órgão do pedido, não do admin.
    expect(admin.calls).toEqual([`grant:${OTHER}:Secretaria de Meio Ambiente`]);
    expect(requestAdmin.calls).toEqual([`approved:req1:${STAFF}`]);
  });

  it("aceita sobrescrever o nome do órgão", async () => {
    const admin = makeAdmin();

    const result = await new ApproveBadgeRequest(
      sessionOf(STAFF_SESSION),
      roles,
      makeBadgeRequests(),
      makeBadgeRequestAdmin(),
      makeProfiles(),
      admin,
      makeReports(),
    ).execute({ requestId: "req1", orgName: "Outro Nome Orgao" });

    expect(result.ok).toBe(true);
    expect(admin.calls).toEqual([`grant:${OTHER}:Outro Nome Orgao`]);
  });

  it("recusa solicitação já decidida", async () => {
    const requestAdmin = makeBadgeRequestAdmin();

    const result = await new ApproveBadgeRequest(
      sessionOf(STAFF_SESSION),
      roles,
      makeBadgeRequests([{ ...PENDING_REQUEST, status: "approved" }]),
      requestAdmin,
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    ).execute({ requestId: "req1" });

    expect(result.ok).toBe(false);
    expect(requestAdmin.calls).toEqual([]);
  });

  it("moderador (não admin) não aprova", async () => {
    const modOnly: RoleDirectory = {
      findRole: vi.fn(async () => "moderator" as UserRole),
    };

    const result = await new ApproveBadgeRequest(
      sessionOf(STAFF_SESSION),
      modOnly,
      makeBadgeRequests(),
      makeBadgeRequestAdmin(),
      makeProfiles(),
      makeAdmin(),
      makeReports(),
    ).execute({ requestId: "req1" });

    expect(result.ok).toBe(false);
  });
});

describe("RejectBadgeRequest (P13/B2)", () => {
  it("admin rejeita com motivo", async () => {
    const requestAdmin = makeBadgeRequestAdmin();

    const result = await new RejectBadgeRequest(
      sessionOf(STAFF_SESSION),
      roles,
      makeBadgeRequests(),
      requestAdmin,
      makeReports(),
    ).execute({ requestId: "req1", reason: "evidência não comprova o vínculo" });

    expect(result.ok).toBe(true);
    expect(requestAdmin.calls).toEqual([`rejected:req1:${STAFF}:evidência não comprova o vínculo`]);
  });

  it("exige motivo", async () => {
    const result = await new RejectBadgeRequest(
      sessionOf(STAFF_SESSION),
      roles,
      makeBadgeRequests(),
      makeBadgeRequestAdmin(),
      makeReports(),
    ).execute({ requestId: "req1", reason: "  " });

    expect(result.ok).toBe(false);
  });

  it("solicitação inexistente não é alterada", async () => {
    const requestAdmin = makeBadgeRequestAdmin();

    const result = await new RejectBadgeRequest(
      sessionOf(STAFF_SESSION),
      roles,
      makeBadgeRequests(),
      requestAdmin,
      makeReports(),
    ).execute({ requestId: "outra", reason: "motivo válido" });

    expect(result.ok).toBe(false);
    expect(requestAdmin.calls).toEqual([]);
  });
});

void VALID_COMMENT_CONTENT;
