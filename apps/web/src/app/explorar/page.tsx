import type { Metadata } from "next";

import { CityExplorer } from "@/shared/ui/city-explorer";

export const metadata: Metadata = {
  title: "Explorar cidades",
  description: "Encontre cidades e acompanhe as publicações públicas das comunidades locais.",
};

export default function ExploreCitiesPage() {
  return <CityExplorer />;
}
