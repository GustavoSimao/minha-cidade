import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Página não encontrada</h1>
      <p className="mt-2 text-text-body">
        O endereço acessado não existe ou foi removido.
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        href="/"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
