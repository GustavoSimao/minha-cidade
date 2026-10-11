import { randomUUID } from "node:crypto";

import type { Result } from "@/shared/kernel/result";
import { fail, ok } from "@/shared/kernel/result";

import type { FeedItem, FeedQuery, LocationValidator, PublicationRepository, CurrentSessionPort } from "./ports";
import { Publication } from "../domain/publication";
import { PublicationType } from "../domain/publication-type";
import type { PublicationMedia } from "../domain/publication-media";
import type { PublicPublicationView } from "../domain/publication";

function toMediaRow(
  media: readonly PublicationMedia[],
): { path: string; position: number; byteSize: number; width: number | null; height: number | null }[] {
  return media.map((item) => ({
    path: item.path,
    position: item.position,
    byteSize: item.byteSize,
    width: item.width,
    height: item.height,
  }));
}

/** Cria uma publicação (invariantes P1–P6; sessão confirmada obrigatória — P3). */
export class CreatePublication {
  constructor(
    private readonly currentSession: CurrentSessionPort,
    private readonly location: LocationValidator,
    private readonly publications: PublicationRepository,
  ) {}

  public async execute(params: {
    type: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    cityId: number;
    neighborhoodId: string | null;
    media: readonly PublicationMedia[];
  }): Promise<Result<{ id: string }>> {
    const session = await this.currentSession();

    // P3: escrever exige conta com e-mail confirmado (login social isento — o
    // Google já confirma; a flag vem da sessão).
    if (session === null) {
      return fail("sessão necessária para publicar");
    }
    if (!session.emailConfirmed) {
      return fail("confirme seu e-mail para publicar");
    }

    // G4/P6: localização válida; bairro obrigatório em município com curadoria.
    const location = await this.location.validate({
      cityId: params.cityId,
      neighborhoodId: params.neighborhoodId,
    });

    if (!location.ok) {
      return fail(location.error);
    }

    if (location.value.hasCuratedNeighborhoods && params.neighborhoodId === null) {
      return fail(`bairro é obrigatório em ${location.value.cityName}`);
    }

    let publication: Publication;
    try {
      publication = Publication.create({
        id: randomUUID(),
        authorId: session.userId,
        type: PublicationType.create(params.type),
        title: params.title,
        content: params.content,
        isAnonymous: params.isAnonymous,
        cityId: params.cityId,
        neighborhoodId: params.neighborhoodId,
        media: params.media,
      });
    } catch (error) {
      return fail(error instanceof Error ? error.message : "publicação inválida");
    }

    await this.publications.create({
      id: publication.id.value,
      authorId: session.userId,
      type: publication.type.value,
      title: publication.title.value,
      content: publication.content.value,
      isAnonymous: publication.isAnonymous,
      cityId: publication.cityId.value,
      neighborhoodId: publication.neighborhoodId,
      media: toMediaRow(publication.media),
    });

    return ok({ id: publication.id.value });
  }
}

/** Edita a própria publicação (P7: só título/corpo/mídia). */
export class UpdateMyPublication {
  constructor(
    private readonly currentSession: CurrentSessionPort,
    private readonly publications: PublicationRepository,
  ) {}

  public async execute(params: {
    id: string;
    title: string;
    content: string;
    media: readonly PublicationMedia[];
  }): Promise<Result<void>> {
    const session = await this.currentSession();

    if (session === null) {
      return fail("sessão necessária");
    }

    const row = await this.publications.findById(params.id);

    if (row === null || row.deleted_at !== null) {
      return fail("publicação não encontrada");
    }

    if (row.author_id !== session.userId) {
      return fail("você só pode editar suas próprias publicações");
    }

    try {
      const publication = Publication.rehydrate({
        id: row.id,
        authorId: row.author_id,
        type: row.type,
        title: row.title,
        content: row.content,
        isAnonymous: row.is_anonymous,
        cityId: row.city_id,
        neighborhoodId: row.neighborhood_id,
        media: [],
        editedAt: row.edited_at ? new Date(row.edited_at) : null,
        hiddenAt: row.hidden_at ? new Date(row.hidden_at) : null,
        hiddenBy: row.hidden_by,
        deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      });

      publication.edit({
        title: params.title,
        content: params.content,
        media: params.media,
      });
    } catch (error) {
      return fail(error instanceof Error ? error.message : "publicação inválida");
    }

    const editedAt = new Date();

    await this.publications.updateEditableFields(params.id, {
      title: params.title.trim(),
      content: params.content.trim(),
      editedAt,
    });

    await this.publications.replaceMedia(params.id, toMediaRow(params.media));

    return ok(undefined);
  }
}

/** Apaga a própria publicação com exclusão lógica (P8). */
export class DeleteMyPublication {
  constructor(
    private readonly currentSession: CurrentSessionPort,
    private readonly publications: PublicationRepository,
  ) {}

  public async execute(id: string): Promise<Result<void>> {
    const session = await this.currentSession();

    if (session === null) {
      return fail("sessão necessária");
    }

    const row = await this.publications.findById(id);

    if (row === null || row.deleted_at !== null) {
      return fail("publicação não encontrada");
    }

    if (row.author_id !== session.userId) {
      return fail("você só pode apagar suas próprias publicações");
    }

    await this.publications.softDelete(id, new Date());

    return ok(undefined);
  }
}

/** Feed público paginado (P8: recente primeiro, sem ranking). */
export class ListFeed {
  constructor(private readonly publications: PublicationRepository) {}

  public async execute(query: FeedQuery): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);

    const { rows, nextCursor } = await this.publications.listPublicFeed({
      ...query,
      limit,
    });

    const items = rows.map((row) => ({
      id: row.id,
      authorId: row.is_anonymous ? null : row.author_id,
      type: row.type as "problem" | "idea",
      title: row.title,
      content: row.content,
      isAnonymous: row.is_anonymous,
      cityId: row.city_id,
      neighborhoodId: row.neighborhood_id,
      media: [],
      editedAt: row.edited_at ? new Date(row.edited_at) : null,
      createdAt: new Date(row.created_at),
      cityName: null,
      neighborhoodName: null,
      author: null,
    })) satisfies FeedItem[];

    return { items, nextCursor };
  }
}

/** Leitura pública de uma publicação (P4/P9). */
export class GetPublication {
  constructor(private readonly publications: PublicationRepository) {}

  public async execute(id: string): Promise<PublicPublicationView | null> {
    const row = await this.publications.findById(id);

    if (row === null || row.deleted_at !== null || row.hidden_at !== null) {
      return null;
    }

    return {
      id: row.id,
      authorId: row.is_anonymous ? null : row.author_id,
      type: row.type as "problem" | "idea",
      title: row.title,
      content: row.content,
      isAnonymous: row.is_anonymous,
      cityId: row.city_id,
      neighborhoodId: row.neighborhood_id,
      media: [],
      editedAt: row.edited_at ? new Date(row.edited_at) : null,
      createdAt: new Date(row.created_at),
    };
  }
}
