import type { PublicationCounts } from "./ports";

/**
 * Agregação pura dos contadores públicos de uma lista de publicações.
 *
 * Mantida fora do repositório para ser testável sem banco: o repositório busca as
 * linhas (RLS de leitura pública) e esta função soma por `publication_id`.
 */
export function aggregatePublicationCounts(params: {
  publicationIds: readonly string[];
  reactions: readonly { publication_id: string; type: string }[];
  comments: readonly { publication_id: string }[];
}): Record<string, PublicationCounts> {
  const counts: Record<string, PublicationCounts> = {};

  for (const id of params.publicationIds) {
    counts[id] = { support: 0, oppose: 0, comments: 0 };
  }

  for (const reaction of params.reactions) {
    const entry = counts[reaction.publication_id];
    if (entry === undefined) {
      continue;
    }

    if (reaction.type === "support") {
      entry.support += 1;
    } else if (reaction.type === "oppose") {
      entry.oppose += 1;
    }
  }

  for (const comment of params.comments) {
    const entry = counts[comment.publication_id];
    if (entry === undefined) {
      continue;
    }

    entry.comments += 1;
  }

  return counts;
}
