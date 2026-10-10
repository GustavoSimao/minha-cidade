import { ValueObject } from "@/shared/kernel/value-object";

/**
 * Papel do usuário no produto (invariante I4).
 * `moderator` e `admin` têm poderes de moderação — ver ADR-0017.
 * Só `service_role` altera o papel (trigger no banco).
 */
export type RoleName = "user" | "moderator" | "admin";

export class Role extends ValueObject<{ name: RoleName }> {
  private static readonly ALLOWED: readonly RoleName[] = ["user", "moderator", "admin"];

  private constructor(name: RoleName) {
    super({ name });
  }

  public static create(raw: string): Role {
    if (!Role.ALLOWED.includes(raw as RoleName)) {
      throw new Error(`papel inválido: ${raw}`);
    }
    return new Role(raw as RoleName);
  }

  public static user(): Role {
    return new Role("user");
  }

  public get name(): RoleName {
    return this.props.name;
  }

  public canModerate(): boolean {
    return this.props.name === "moderator" || this.props.name === "admin";
  }

  public canRemoveContent(): boolean {
    return this.props.name === "admin";
  }

  protected equalsTo(other: { name: RoleName }): boolean {
    return this.props.name === other.name;
  }
}
