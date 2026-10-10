/**
 * Resultado explícito de caso de uso: evita exceções para falhas
 * esperadas de domínio (validação, invariante violada, não encontrado).
 */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(error: string): Result<T> =>
  ({ ok: false, error }) as Result<T>;

export const isOk = <T>(result: Result<T>): result is { ok: true; value: T } =>
  result.ok;
