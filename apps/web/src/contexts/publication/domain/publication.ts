import { Entity, DomainEvent } from "@/shared/kernel/entity";
import { Identifier } from "@/shared/kernel/identifier";
import { IbgeCode } from "@/contexts/geography/domain/city";
import {
  MAX_MEDIA_PER_PUBLICATION,
  PublicationMedia,
  validateMediaList,
} from "./publication-media";
import { Content } from "./title-content";
import { PublicationType } from "./publication-type";
import { Title } from "./title-content";

/** Identificador de publicação. */
export class PublicationId extends Identifier<string> {}

/**
 * Publicação (problema ou ideia) de um morador.
 *
 * Invariantes protegidas:
 *  - P1: tipo imutável; P2: tamanhos de título/texto;
 *  - P3: autor obrigatório na criação (sessão confirmada — regra de aplicação);
 *  - P4: leitura pública de anônima não expõe autor (`toPublicView`);
 *  - P7: só título/corpo/mídia são editáveis; tipo, autor, local e anonimato são
 *    imutáveis depois de criados (P14);
 *  - P8: apagar é exclusão lógica (`deletedAt`);
 *  - P9: ocultada (`hiddenAt`) ou apagada não aparece em leitura pública.
 */
export class Publication extends Entity<PublicationId> {
  private _authorId: string | null;
  private _type: PublicationType;
  private _title: Title;
  private _content: Content;
  private _isAnonymous: boolean;
  private _cityId: IbgeCode;
  private _neighborhoodId: string | null;
  private _media: PublicationMedia[];
  private _editedAt: Date | null;
  private _hiddenAt: Date | null;
  private _hiddenBy: string | null;
  private _deletedAt: Date | null;

  private constructor(params: {
    id: PublicationId;
    authorId: string | null;
    type: PublicationType;
    title: Title;
    content: Content;
    isAnonymous: boolean;
    cityId: IbgeCode;
    neighborhoodId: string | null;
    media: PublicationMedia[];
    editedAt: Date | null;
    hiddenAt: Date | null;
    hiddenBy: string | null;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._authorId = params.authorId;
    this._type = params.type;
    this._title = params.title;
    this._content = params.content;
    this._isAnonymous = params.isAnonymous;
    this._cityId = params.cityId;
    this._neighborhoodId = params.neighborhoodId;
    this._media = params.media;
    this._editedAt = params.editedAt;
    this._hiddenAt = params.hiddenAt;
    this._hiddenBy = params.hiddenBy;
    this._deletedAt = params.deletedAt;
  }

  /** Cria uma publicação nova (invariantes P1–P6 validadas pelo caso de uso). */
  public static create(params: {
    id: string;
    authorId: string;
    type: PublicationType;
    title: string;
    content: string;
    isAnonymous: boolean;
    cityId: number;
    neighborhoodId: string | null;
    media?: readonly PublicationMedia[];
  }): Publication {
    return new Publication({
      id: new PublicationId(params.id),
      authorId: params.authorId,
      type: params.type,
      title: Title.create(params.title),
      content: Content.create(params.content),
      isAnonymous: params.isAnonymous,
      cityId: IbgeCode.create(params.cityId),
      // G4/P6: bairro exige cidade (a validação do par é do caso de uso/banco).
      neighborhoodId:
        params.neighborhoodId !== null && params.cityId === null
          ? null
          : params.neighborhoodId,
      media: validateMediaList(params.media ?? []),
      editedAt: null,
      hiddenAt: null,
      hiddenBy: null,
      deletedAt: null,
    });
  }

  /** Reconstrói uma publicação existente a partir da persistência. */
  public static rehydrate(row: {
    id: string;
    authorId: string | null;
    type: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    cityId: number;
    neighborhoodId: string | null;
    media: readonly PublicationMedia[];
    editedAt: Date | null;
    hiddenAt: Date | null;
    hiddenBy: string | null;
    deletedAt: Date | null;
  }): Publication {
    return new Publication({
      id: new PublicationId(row.id),
      authorId: row.authorId,
      type: PublicationType.create(row.type),
      title: Title.create(row.title),
      content: Content.create(row.content),
      isAnonymous: row.isAnonymous,
      cityId: IbgeCode.create(row.cityId),
      neighborhoodId: row.neighborhoodId,
      media: validateMediaList(row.media),
      editedAt: row.editedAt,
      hiddenAt: row.hiddenAt,
      hiddenBy: row.hiddenBy,
      deletedAt: row.deletedAt,
    });
  }

  public get authorId(): string | null {
    return this._authorId;
  }

  public get type(): PublicationType {
    return this._type;
  }

  public get title(): Title {
    return this._title;
  }

  public get content(): Content {
    return this._content;
  }

  public get isAnonymous(): boolean {
    return this._isAnonymous;
  }

  public get cityId(): IbgeCode {
    return this._cityId;
  }

  public get neighborhoodId(): string | null {
    return this._neighborhoodId;
  }

  public get media(): readonly PublicationMedia[] {
    return this._media;
  }

  public get editedAt(): Date | null {
    return this._editedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /** P9: pública = não apagada e não oculta. */
  public get isPubliclyVisible(): boolean {
    return this._deletedAt === null && this._hiddenAt === null;
  }

  /** P7: edição livre apenas de título/corpo/mídia (regra do banco garante o resto). */
  public edit(params: {
    title: string;
    content: string;
    media: readonly PublicationMedia[];
  }): void {
    this._title = Title.create(params.title);
    this._content = Content.create(params.content);
    this._media = validateMediaList(params.media);
    this._editedAt = new Date();

    this.record(new PublicationUpdatedEvent(this.id.value, ["title", "content", "media"]));
  }

  /** P8: exclusão lógica — some das leituras públicas, preservada no banco. */
  public softDelete(): void {
    this._deletedAt = new Date();
    this.record(new PublicationDeletedEvent(this.id.value));
  }

  /** Projeção pública (P4): `authorId` é `null` quando anônima. */
  public toPublicView(): PublicPublicationView {
    return {
      id: this.id.value,
      authorId: this._isAnonymous ? null : this._authorId,
      type: this._type.value,
      title: this._title.value,
      content: this._content.value,
      isAnonymous: this._isAnonymous,
      cityId: this._cityId.value,
      neighborhoodId: this._neighborhoodId,
      media: [...this._media],
      editedAt: this._editedAt,
      createdAt: null,
    };
  }
}

/** Projeção pública de publicação (invariante P4 — autor some quando anônima). */
export interface PublicPublicationView {
  id: string;
  authorId: string | null;
  type: "problem" | "idea";
  title: string;
  content: string;
  isAnonymous: boolean;
  cityId: number;
  neighborhoodId: string | null;
  media: PublicationMedia[];
  editedAt: Date | null;
  createdAt: Date | null;
}

export class PublicationUpdatedEvent extends DomainEvent {
  constructor(
    public readonly publicationId: string,
    public readonly changed: readonly string[],
  ) {
    super("publication.publication_updated");
  }
}

export class PublicationDeletedEvent extends DomainEvent {
  constructor(public readonly publicationId: string) {
    super("publication.publication_deleted");
  }
}

export { MAX_MEDIA_PER_PUBLICATION };
