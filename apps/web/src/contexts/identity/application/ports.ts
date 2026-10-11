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
  role: string;
  verified_org: string | null;
  is_verified: boolean;
  city_id: number | null;
  neighborhood_id: string | null;
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
