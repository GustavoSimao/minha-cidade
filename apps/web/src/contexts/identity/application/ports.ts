import type { Profile } from "../domain/profile";
import type { ProfileEditableFields, PublicProfileView } from "../domain/profile";

/** Linha de `identity.profiles` como vem do banco. */
export interface ProfileRow {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  phone: string | null;
  avatar_path: string | null;
  cover_path: string | null;
  website: string | null;
  role: string;
  verified_org: string | null;
  is_verified: boolean;
  city_id: number | null;
  neighborhood_id: string | null;
  show_neighborhood: boolean;
  termos_aceitos_em: string | null;
  created_at: string;
}

/**
 * Porta de persistência do contexto Identity (D6: infraestrutura depende de abstração).
 * A implementação atual é Supabase; os casos de uso só conhecem esta interface.
 */
export interface ProfileRepository {
  /** Projeção pública do perfil por username (I7) ou `null` se não existir. */
  findPublicViewByUsername(username: string): Promise<PublicProfileView | null>;

  /**
   * Projeções públicas em lote por ids (I7) — usada pelo feed de publicações
   * para exibir autores identificados ( publicação anônima não chega aqui ).
   */
  findPublicViewsByIds(ids: readonly string[]): Promise<PublicProfileView[]>;

  /**
   * Projeções públicas de um bairro (I7) — sugestões de amizade (S3).
   * `excludeIds` remove pessoas já relacionadas (a query aplica o filtro).
   */
  listPublicViewsByNeighborhood(
    neighborhoodId: string,
    options: { limit: number; excludeIds?: readonly string[] },
  ): Promise<PublicProfileView[]>;

  /** Projeções públicas da plataforma (I7) — descoberta de pessoas (S3). */
  listPublicViews(options: { limit: number; excludeIds?: readonly string[] }): Promise<PublicProfileView[]>;

  /** Perfil completo do dono (somente próprio uso). */
  findById(id: string): Promise<Profile | null>;

  /** Persiste os campos editáveis do perfil do próprio usuário. */
  updateEditableFields(id: string, fields: ProfileEditableFields): Promise<void>;

  /** True se o username já está em uso (usado na colisão de username). */
  usernameExists(username: string): Promise<boolean>;

  /** Apaga o perfil e os dados próprios em cascata. */
  deleteById(id: string): Promise<void>;
}

/** Sessão autenticada corrente. */
export interface AuthSession {
  userId: string;
  email: string;
  emailConfirmed: boolean;
}

/** Porta de autenticação (Supabase Auth ficava fora do nosso domínio). */
export interface AuthGateway {
  currentSession(): Promise<AuthSession | null>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUp(params: {
    name: string;
    email: string;
    password: string;
    termsAcceptedAt: Date;
  }): Promise<{ userId: string; needsEmailConfirmation: boolean }>;
  signInWithGoogle(redirectTo: string): Promise<string>;
  exchangeCodeForSession(code: string): Promise<void>;
  signOut(): Promise<void>;
  /** Verifica a senha do usuário autenticado (usado no encerramento de conta). */
  verifyPassword(email: string, password: string): Promise<boolean>;
  /** Apaga o usuário do Auth (dispara o cascade do perfil). */
  deleteUser(userId: string): Promise<void>;
}

/**
 * Gancho executado antes do encerramento da conta (invariante I8).
 * A Fase 2 implementa um no-op; a Fase 4 (Publication) implementa a anonimização.
 */
export type BeforeAccountClosed = (userId: string) => Promise<void>;

export const noopBeforeAccountClosed: BeforeAccountClosed = async () => {};

/** Linha de `identity.badge_requests` como vem do banco (P13/B2). */
export interface BadgeRequestRow {
  id: string;
  user_id: string;
  org_name: string;
  evidence_url: string;
  evidence_email: string | null;
  message: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  created_at: string;
}

/** Situação do pedido de selo do próprio usuário (tela `/solicitar-selo`). */
export interface MyBadgeRequestView {
  status: "pending" | "approved" | "rejected";
  orgName: string;
  evidenceUrl: string;
  decisionReason: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}

/**
 * Porta das solicitações de selo (P13/B2). Dono escreve a própria linha; a
 * fila e as decisões do admin ficam no contexto Moderation (D6).
 */
export interface BadgeRequestRepository {
  create(input: {
    id: string;
    userId: string;
    orgName: string;
    evidenceUrl: string;
    evidenceEmail: string | null;
    message: string | null;
  }): Promise<void>;

  /** Pendência aberta do usuário (bloqueia uma segunda solicitação). */
  findPendingByUserId(userId: string): Promise<BadgeRequestRow | null>;

  /** Pedido mais recente do usuário (para exibir o estado na tela). */
  findLatestByUserId(userId: string): Promise<BadgeRequestRow | null>;

  /** Outbox de eventos (D7): o evento entra pelo cliente de serviço. */
  recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
