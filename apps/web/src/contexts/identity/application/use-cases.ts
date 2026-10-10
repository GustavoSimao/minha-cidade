import { Profile } from "@/contexts/identity/domain/profile";
import type { ProfileEditableFields } from "@/contexts/identity/domain/profile";
import type {
  AuthGateway,
  BeforeAccountClosed,
  ProfileRepository,
} from "./ports";

/** Resultado de caso de uso: sucesso com valor, ou falha com mensagem. */
export type UseCaseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const ok = <T>(value: T): UseCaseResult<T> => ({ ok: true, value });
const fail = <T>(error: string): UseCaseResult<T> => ({ ok: false, error });

export class UpdateMyProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auth: AuthGateway,
  ) {}

  /**
   * Atualiza apenas os campos que o usuário pode alterar.
   * Invariantes I2/I4/I5 são protegidas pelo domínio e pelo trigger no banco.
   */
  async execute(input: Partial<ProfileEditableFields>): Promise<UseCaseResult<PublicProfileSnapshot>> {
    const session = await this.auth.currentSession();
    if (!session) {
      return fail("sessão expirada: entre novamente");
    }

    const current = await this.profiles.findById(session.userId);
    if (!current) {
      return fail("perfil não encontrado");
    }

    const fields: ProfileEditableFields = {
      fullName: input.fullName ?? current.fullName.value,
      bio: input.bio ?? null,
      phone: input.phone ?? current.phone,
      avatarPath: input.avatarPath ?? null,
      coverPath: input.coverPath ?? null,
      cityId: input.cityId ?? current.cityId,
      neighborhoodId: input.neighborhoodId ?? current.neighborhoodId,
    };

    try {
      current.updateEditableFields(fields);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "dados inválidos");
    }

    await this.profiles.updateEditableFields(session.userId, fields);

    return ok({
      username: current.username.value,
      fullName: current.fullName.value,
      cityId: current.cityId,
      neighborhoodId: current.neighborhoodId,
    });
  }
}

export class CloseMyAccount {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auth: AuthGateway,
    private readonly beforeClosed: BeforeAccountClosed,
  ) {}

  /**
   * Invariante I8: anonimiza publicações, apaga os dados próprios e remove o usuário do
   * Auth (o cascade apaga o perfil).
   */
  async execute(password: string): Promise<UseCaseResult<null>> {
    const session = await this.auth.currentSession();
    if (!session) {
      return fail("sessão expirada: entre novamente");
    }

    const valid = await this.auth.verifyPassword(session.email, password);
    if (!valid) {
      return fail("senha incorreta");
    }

    // 1. anonimiza publicações (no-op na Fase 2; implementado na Fase 4).
    await this.beforeClosed(session.userId);

    // 2. apaga os dados próprios que não dependem do cascade do Auth.
    await this.profiles.deleteById(session.userId);

    // 3. remove o usuário do Auth (em produção, pelo painel/admin ou função server-side).
    await this.auth.deleteUser(session.userId);

    return ok(null);
  }
}

export interface PublicProfileSnapshot {
  username: string;
  fullName: string;
  cityId: number | null;
  neighborhoodId: string | null;
}

export { Profile };
