import { ValueObject } from "@/shared/kernel/value-object";

/** Limite de tamanho por arquivo: 10 MiB (P5). */
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

/** Máximo de imagens por publicação (P5). */
export const MAX_MEDIA_PER_PUBLICATION = 3;

/**
 * Imagem de publicação (invariante P5): objeto no bucket `publication-media`,
 * posição ordenada 1..3, no máximo 10 MiB.
 */
export class PublicationMedia extends ValueObject<{
  path: string;
  position: number;
  byteSize: number;
  width: number | null;
  height: number | null;
}> {
  private constructor(params: {
    path: string;
    position: number;
    byteSize: number;
    width: number | null;
    height: number | null;
  }) {
    super(params);
  }

  public static create(params: {
    path: string;
    position: number;
    byteSize: number;
    width?: number | null;
    height?: number | null;
  }): PublicationMedia {
    if (params.path.trim().length === 0) {
      throw new Error("caminho da mídia é obrigatório");
    }

    if (
      !Number.isInteger(params.position) ||
      params.position < 1 ||
      params.position > MAX_MEDIA_PER_PUBLICATION
    ) {
      throw new Error(`posição da mídia deve ser 1..${MAX_MEDIA_PER_PUBLICATION}`);
    }

    if (
      !Number.isInteger(params.byteSize) ||
      params.byteSize <= 0 ||
      params.byteSize > MAX_MEDIA_BYTES
    ) {
      throw new Error("mídia deve ter entre 1 byte e 10 MiB");
    }

    return new PublicationMedia({
      path: params.path.trim(),
      position: params.position,
      byteSize: params.byteSize,
      width: params.width ?? null,
      height: params.height ?? null,
    });
  }

  public get path(): string {
    return this.props.path;
  }

  public get position(): number {
    return this.props.position;
  }

  public get byteSize(): number {
    return this.props.byteSize;
  }

  public get width(): number | null {
    return this.props.width;
  }

  public get height(): number | null {
    return this.props.height;
  }

  protected equalsTo(other: {
    path: string;
    position: number;
    byteSize: number;
    width: number | null;
    height: number | null;
  }): boolean {
    return (
      this.props.path === other.path &&
      this.props.position === other.position &&
      this.props.byteSize === other.byteSize &&
      this.props.width === other.width &&
      this.props.height === other.height
    );
  }
}

/** Lista de mídias válida para uma publicação (0..3, posições únicas e ordenadas). */
export function validateMediaList(media: readonly PublicationMedia[]): PublicationMedia[] {
  if (media.length > MAX_MEDIA_PER_PUBLICATION) {
    throw new Error(`máximo de ${MAX_MEDIA_PER_PUBLICATION} imagens por publicação`);
  }

  const positions = media.map((item) => item.position);
  if (new Set(positions).size !== positions.length) {
    throw new Error("posições de mídia duplicadas");
  }

  return [...media].sort((a, b) => a.position - b.position);
}
