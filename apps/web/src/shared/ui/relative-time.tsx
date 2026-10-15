"use client";

import { useSyncExternalStore } from "react";

/**
 * Tempo relativo ("há 3 h") calculado no CLIENTE.
 *
 * O servidor não pode ler o relógio durante o render (Cache Components do
 * Next 16 reprovam `Date.now()` no prerender), então o servidor entrega a data
 * absoluta e o cliente passa a exibir o relativo depois da hidratação.
 *
 * `useSyncExternalStore` é o padrão do React para valor que difere entre
 * servidor e cliente: na hidratação usa o snapshot do servidor (data
 * absoluta, sem ler o relógio) e, já no cliente, troca pelo relativo — sem
 * `useState` em efeito e sem divergência de hidratação.
 */
const subscribe = () => () => {};

// Formatos caros de criar: uma instância por módulo (o feed monta dezenas de
// cards, e um `Intl.*` por card pesa na hidratação).
let relativeTimeFormat: Intl.RelativeTimeFormat | null = null;
let absoluteTimeFormat: Intl.DateTimeFormat | null = null;

function formatRelative(seconds: number, unit: Intl.RelativeTimeFormatUnit): string {
  relativeTimeFormat ??= new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  return relativeTimeFormat.format(-seconds, unit);
}

function formatAbsolute(iso: string): string {
  absoluteTimeFormat ??= new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return absoluteTimeFormat.format(new Date(iso));
}

function relativeLabel(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

  if (Math.abs(seconds) < 60) {
    return formatRelative(seconds, "second");
  }

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return formatRelative(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatRelative(hours, "hour");
  }

  return formatRelative(Math.round(hours / 24), "day");
}

export function RelativeTime({ date }: { date: Date | string }) {
  const iso = typeof date === "string" ? date : date.toISOString();
  const absolute = formatAbsolute(iso);

  const relative = useSyncExternalStore(
    subscribe,
    () => relativeLabel(iso),
    () => absolute,
  );

  return (
    <time dateTime={iso} title={absolute}>
      {relative}
    </time>
  );
}
