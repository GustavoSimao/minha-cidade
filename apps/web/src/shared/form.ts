/** Utilitários de leitura de FormData para server actions (entrada sempre não confiável). */

/** Primeiro valor string de um campo do formulário ("" se ausente). */
export function first(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Checkbox marcado (on/true). */
export function check(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
