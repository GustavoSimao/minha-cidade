import { describe, expect, it } from "vitest";

import { aggregatePublicationCounts } from "./aggregate-counts";

const IDS = ["pub-1", "pub-2"];

describe("aggregatePublicationCounts", () => {
  it("zera os contadores de publicações sem interação", () => {
    const counts = aggregatePublicationCounts({
      publicationIds: IDS,
      reactions: [],
      comments: [],
    });

    expect(counts).toEqual({
      "pub-1": { support: 0, oppose: 0, comments: 0 },
      "pub-2": { support: 0, oppose: 0, comments: 0 },
    });
  });

  it("soma apoios, oposições e comentários por publicação", () => {
    const counts = aggregatePublicationCounts({
      publicationIds: IDS,
      reactions: [
        { publication_id: "pub-1", type: "support" },
        { publication_id: "pub-1", type: "support" },
        { publication_id: "pub-1", type: "oppose" },
        { publication_id: "pub-2", type: "oppose" },
        { publication_id: "pub-2", type: "oppose" },
      ],
      comments: [
        { publication_id: "pub-1" },
        { publication_id: "pub-1" },
        { publication_id: "pub-1" },
      ],
    });

    expect(counts["pub-1"]).toEqual({ support: 2, oppose: 1, comments: 3 });
    expect(counts["pub-2"]).toEqual({ support: 0, oppose: 2, comments: 0 });
  });

  it("ignora linhas de publicações fora da lista e tipos desconhecidos", () => {
    const counts = aggregatePublicationCounts({
      publicationIds: IDS,
      reactions: [
        { publication_id: "pub-1", type: "support" },
        { publication_id: "outra-publicacao", type: "support" },
        { publication_id: "pub-2", type: "reaction_inexistente" },
      ],
      comments: [{ publication_id: "outra-publicacao" }],
    });

    expect(counts["pub-1"]).toEqual({ support: 1, oppose: 0, comments: 0 });
    expect(counts["pub-2"]).toEqual({ support: 0, oppose: 0, comments: 0 });
  });
});
