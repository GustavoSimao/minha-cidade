import { describe, expect, it } from "vitest";

import {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_PUBLICATION,
  PublicationMedia,
  validateMediaList,
} from "./publication-media";

function media(params: Partial<Parameters<typeof PublicationMedia.create>[0]> = {}) {
  return PublicationMedia.create({
    path: "publication-media/user/pub-1.webp",
    position: 1,
    byteSize: 1024,
    width: 1600,
    height: 1200,
    ...params,
  });
}

describe("PublicationMedia", () => {
  it("aceita até 3 posições ordenadas", () => {
    const list = validateMediaList([
      media({ position: 3, path: "c.webp" }),
      media({ position: 1, path: "a.webp" }),
      media({ position: 2, path: "b.webp" }),
    ]);
    expect(list.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  it("rejeita mais de 3 imagens (P5)", () => {
    const items = [
      media({ position: 1, path: "a.webp" }),
      media({ position: 2, path: "b.webp" }),
      media({ position: 3, path: "c.webp" }),
      media({ position: 3, path: "d.webp" }),
    ];
    expect(() => validateMediaList(items)).toThrow(/máximo de 3/);
    expect(MAX_MEDIA_PER_PUBLICATION).toBe(3);
  });

  it("rejeita posição fora de 1..3", () => {
    expect(() => media({ position: 0 })).toThrow(/posição/);
    expect(() => media({ position: 4 })).toThrow(/posição/);
  });

  it("rejeita arquivo acima de 10 MiB (P5)", () => {
    expect(() => media({ byteSize: MAX_MEDIA_BYTES + 1 })).toThrow(/10 MiB/);
  });

  it("rejeita caminho vazio", () => {
    expect(() => media({ path: "  " })).toThrow(/caminho/);
  });

  it("rejeita posições duplicadas", () => {
    expect(() =>
      validateMediaList([media({ position: 1 }), media({ position: 1 })]),
    ).toThrow(/duplicadas/);
  });
});
