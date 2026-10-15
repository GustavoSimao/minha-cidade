import { ValueObject } from "@/shared/kernel/value-object";

/**
 * Salvamento ("ler depois") de uma publicação por um usuário.
 *
 * Invariantes (spec docs/04-contexts/engagement.md):
 *  - E6: privado — só o dono vê a própria lista (RLS);
 *  - salvar é idempotente (PK `user_id, publication_id` no banco).
 */
export class Bookmark extends ValueObject<{
  userId: string;
  publicationId: string;
  createdAt: Date;
}> {
  private constructor(params: {
    userId: string;
    publicationId: string;
    createdAt: Date;
  }) {
    super(params);
  }

  public static create(params: {
    userId: string;
    publicationId: string;
    createdAt?: Date;
  }): Bookmark {
    return new Bookmark({
      userId: params.userId,
      publicationId: params.publicationId,
      createdAt: params.createdAt ?? new Date(),
    });
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get publicationId(): string {
    return this.props.publicationId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  protected equalsTo(other: {
    userId: string;
    publicationId: string;
    createdAt: Date;
  }): boolean {
    return (
      this.props.userId === other.userId &&
      this.props.publicationId === other.publicationId &&
      this.props.createdAt.getTime() === other.createdAt.getTime()
    );
  }
}
