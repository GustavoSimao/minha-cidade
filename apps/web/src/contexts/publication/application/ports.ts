import type { Result } from "@/shared/kernel/result";
import type { PublicPublicationView } from "../domain/publication";

/** Linha de `publication.publications` como vem do banco. */
export interface PublicationRow {
  id: string;
  author_id: string | null;
  type: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  city_id: number;
  neighborhood_id: string | null;
  edited_at: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
  deleted_at: string | null;
  created_at: string;
}

/** Linha de `publication.publication_media` como vem do banco. */
export interface PublicationMediaRow {
  publication_id: string;
  path: string;
  position: number;
  byte_size: number;
  width: number | null;
  height: number | null;
}

/** Sessão necessária para escrever (invariante P3). */
export interface PublicationSession {
  userId: string;
  emailConfirmed: boolean;
}

/** Porta de sessão — implementada pelo gateway de Identity na interface. */
export type CurrentSessionPort = () => Promise<PublicationSession | null>;

/**
 * Validação de localização (G4/P6) — integração com Geography por porta,
 * para que a aplicação de Publication não dependa das classes concretas.
 */
export interface LocationValidator {
  validate(params: {
    cityId: number;
    neighborhoodId: string | null;
  }): Promise<
    Result<{
      cityName: string;
      neighborhoodName: string | null;
      /** true quando o município tem lista curada de bairros (P6). */
      hasCuratedNeighborhoods: boolean;
    }>
  >;
}

/** Projeção pública de autor para exibição no feed (P4 respeita anonimato). */
export interface PublicAuthor {
  username: string;
  fullName: string;
  avatarPath: string | null;
}

/** Porta de leitura pública de autores (Identity), em lote. */
export interface AuthorDirectory {
  findPublicAuthors(ids: readonly string[]): Promise<Map<string, PublicAuthor>>;
}

/** Item do feed: publicação pública + nomes resolvidos (sem JOIN entre schemas — D7). */
export interface FeedItem extends PublicPublicationView {
  cityName: string | null;
  neighborhoodName: string | null;
  author: PublicAuthor | null;
  createdAt: Date;
}

/** Filtros e paginação do feed (P8: recente primeiro, sem ranking). */
export interface FeedQuery {
  cityId?: number | null;
  neighborhoodId?: string | null;
  type?: "problem" | "idea" | null;
  cursor?: string | null;
  limit?: number;
}

/** Porta de persistência do contexto Publication (D6). */
export interface PublicationRepository {
  create(publication: {
    id: string;
    authorId: string;
    type: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    cityId: number;
    neighborhoodId: string | null;
    media: readonly { path: string; position: number; byteSize: number; width: number | null; height: number | null }[];
  }): Promise<void>;

  findById(id: string): Promise<PublicationRow | null>;

  findMediaRows(publicationId: string): Promise<PublicationMediaRow[]>;

  /** Leitura pública paginada (P8/P9): só não apagadas e não ocultas. */
  listPublicFeed(query: FeedQuery): Promise<{ rows: PublicationRow[]; nextCursor: string | null }>;

  /** Atualiza título/corpo/mídia e marca `edited_at` (P7). */
  updateEditableFields(
    id: string,
    fields: { title: string; content: string; editedAt: Date },
  ): Promise<void>;

  replaceMedia(
    id: string,
    media: readonly { path: string; position: number; byteSize: number; width: number | null; height: number | null }[],
  ): Promise<void>;

  /** Exclusão lógica (P8). */
  softDelete(id: string, deletedAt: Date): Promise<void>;
}
