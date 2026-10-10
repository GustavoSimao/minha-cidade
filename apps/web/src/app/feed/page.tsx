import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed do bairro",
  description: "Publicações de problemas e ideias do seu bairro.",
};

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-strong">Feed do bairro</h1>

      <div className="mt-4 rounded-card border border-dashed border-border-subtle bg-surface-raised p-6 text-center">
        <p className="text-text-body">
          O feed é entregue na <strong>Fase 4</strong> do projeto, junto com a criação de
          publicações (problema/ideia, com fotos e opção de anonimato) e o armazenamento
          de imagens.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          O que já funciona hoje: cadastro e login (Google ou e-mail/senha), perfil
          público em <code>/perfil/{"{username}"}</code> e edição do próprio perfil.
        </p>
      </div>
    </div>
  );
}
