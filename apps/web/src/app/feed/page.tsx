import { redirect } from "next/navigation";

// A home É o feed (`app/page.tsx`); `/feed` existe só como redirect, para não
// quebrar links antigos (bookmarks, demos, e-mail).
export const instant = false;

interface FeedRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** `/feed` (e `/feed?cidade=…&tipo=…`) redireciona para `/` preservando os filtros. */
export default async function FeedRedirectPage({ searchParams }: FeedRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const search = query.toString();
  redirect(search === "" ? "/" : `/?${search}`);
}
