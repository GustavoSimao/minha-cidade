import { Entity } from "@/shared/kernel/entity";
import { Identifier } from "@/shared/kernel/identifier";
import { DomainEvent } from "@/shared/kernel/entity";
import { FullName } from "./full-name";
import { Role } from "./role";
import { Username } from "./username";
import { VerifiedOrg } from "./verified-org";

/** Identificador de perfil (igual ao id do Supabase Auth). */
export class ProfileId extends Identifier<string> {}

/** Projeção pública do perfil (invariante I7 — nunca expõe e-mail/telefone). */
export interface PublicProfileView {
  id: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarPath: string | null;
  coverPath: string | null;
  role: string;
  verifiedOrg: string | null;
  isVerified: boolean;
  cityId: number | null;
  neighborhoodId: string | null;
  createdAt: Date;
}

/** Campos que o próprio usuário pode alterar no perfil. */
export interface ProfileEditableFields {
  fullName: string;
  bio: string | null;
  phone: string | null;
  avatarPath: string | null;
  coverPath: string | null;
  cityId: number | null;
  neighborhoodId: string | null;
}

/**
 * Perfil de produto, 1:1 com `auth.users` (invariante I1).
 *
 * Invariantes protegidas:
 *  - I2: `username` é imutável depois de criado;
 *  - I4/I5: `role` e selo institucional só mudam por administrador
 *    (trigger `identity.enforce_profile_invariants`);
 *  - I8: encerrar conta anonimiza publicações e apaga o perfil.
 */
export class Profile extends Entity<ProfileId> {
  private _username: Username;
  private _fullName: FullName;
  private _bio: string | null;
  private _phone: string | null;
  private _avatarPath: string | null;
  private _coverPath: string | null;
  private _role: Role;
  private _verifiedOrg: VerifiedOrg | null;
  private _cityId: number | null;
  private _neighborhoodId: string | null;
  private _termsAcceptedAt: Date;

  private constructor(params: {
    id: ProfileId;
    username: Username;
    fullName: FullName;
    bio: string | null;
    phone: string | null;
    avatarPath: string | null;
    coverPath: string | null;
    role: Role;
    verifiedOrg: VerifiedOrg | null;
    cityId: number | null;
    neighborhoodId: string | null;
    termsAcceptedAt: Date;
  }) {
    super(params.id);
    this._username = params.username;
    this._fullName = params.fullName;
    this._bio = params.bio;
    this._phone = params.phone;
    this._avatarPath = params.avatarPath;
    this._coverPath = params.coverPath;
    this._role = params.role;
    this._verifiedOrg = params.verifiedOrg;
    this._cityId = params.cityId;
    this._neighborhoodId = params.neighborhoodId;
    this._termsAcceptedAt = params.termsAcceptedAt;
  }

  /** Cria um perfil novo (o username é gerado uma única vez). */
  public static create(params: {
    id: ProfileId;
    name: string;
    termsAcceptedAt: Date;
  }): Profile {
    return new Profile({
      id: params.id,
      username: Username.fromName(params.name),
      fullName: FullName.create(params.name),
      bio: null,
      phone: null,
      avatarPath: null,
      coverPath: null,
      role: Role.user(),
      verifiedOrg: null,
      cityId: null,
      neighborhoodId: null,
      termsAcceptedAt: params.termsAcceptedAt,
    });
  }

  /** Reconstrói um perfil existente a partir da persistência. */
  public static rehydrate(row: {
    id: string;
    username: string;
    fullName: string;
    bio: string | null;
    phone: string | null;
    avatarPath: string | null;
    coverPath: string | null;
    role: string;
    verifiedOrg: string | null;
    cityId: number | null;
    neighborhoodId: string | null;
    termsAcceptedAt: Date | null;
  }): Profile {
    return new Profile({
      id: new ProfileId(row.id),
      username: Username.create(row.username),
      fullName: FullName.create(row.fullName),
      bio: row.bio,
      phone: row.phone,
      avatarPath: row.avatarPath,
      coverPath: row.coverPath,
      role: Role.create(row.role),
      verifiedOrg: row.verifiedOrg ? VerifiedOrg.create(row.verifiedOrg) : null,
      cityId: row.cityId,
      neighborhoodId: row.neighborhoodId,
      termsAcceptedAt: row.termsAcceptedAt ?? new Date(0),
    });
  }

  public get username(): Username {
    return this._username;
  }

  public get fullName(): FullName {
    return this._fullName;
  }

  public get role(): Role {
    return this._role;
  }

  public get verifiedOrg(): VerifiedOrg | null {
    return this._verifiedOrg;
  }

  public get isVerified(): boolean {
    return this._verifiedOrg !== null;
  }

  public get cityId(): number | null {
    return this._cityId;
  }

  public get neighborhoodId(): string | null {
    return this._neighborhoodId;
  }

  public get phone(): string | null {
    return this._phone;
  }

  /** Aplica apenas os campos que o próprio usuário pode alterar (I2/I4/I5). */
  public updateEditableFields(fields: ProfileEditableFields): void {
    this._fullName = FullName.create(fields.fullName);

    if (fields.bio !== null && fields.bio.length > 2000) {
      throw new Error("bio deve ter no máximo 2000 caracteres");
    }

    this._bio = fields.bio;
    this._phone = fields.phone;
    this._avatarPath = fields.avatarPath;
    this._coverPath = fields.coverPath;

    // Bairro só pode ser definido junto com a cidade.
    if (fields.neighborhoodId !== null && fields.cityId === null) {
      throw new Error("cidade é obrigatória quando há bairro");
    }

    this._cityId = fields.cityId;
    this._neighborhoodId = fields.cityId === null ? null : fields.neighborhoodId;

    this.record(new ProfileUpdatedEvent(this.id.value, ["full_name", "bio", "phone", "location"]));
  }

  /** Projeção pública — a única forma de expor o perfil para terceiros (I7). */
  public toPublicView(createdAt: Date): PublicProfileView {
    return {
      id: this.id.value,
      username: this._username.value,
      fullName: this._fullName.value,
      bio: this._bio,
      avatarPath: this._avatarPath,
      coverPath: this._coverPath,
      role: this._role.name,
      verifiedOrg: this._verifiedOrg?.name ?? null,
      isVerified: this.isVerified,
      cityId: this._cityId,
      neighborhoodId: this._neighborhoodId,
      createdAt,
    };
  }
}

export class ProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly profileId: string,
    public readonly changed: readonly string[],
  ) {
    super("identity.profile_updated");
  }
}
