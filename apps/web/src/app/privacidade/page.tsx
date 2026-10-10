import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-text-body">
      <h1 className="text-2xl font-bold text-text-strong">Política de privacidade</h1>
      <p className="text-sm text-text-muted">Última atualização: 10 de outubro de 2026.</p>

      <h2 className="text-lg font-semibold text-text-strong">Quais dados coletamos</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>E-mail</strong> — para autenticação, confirmação de conta e comunicações
          de segurança;
        </li>
        <li>
          <strong>Publicações</strong> — título, texto, imagens e a cidade/bairro
          escolhidos;
        </li>
        <li>
          <strong>Interações</strong> — reações, comentários, amizades, salvamentos e
          denúncias;
        </li>
        <li>
          <strong>Dados técnicos mínimos</strong> — necessários para o rate limit de uso.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-text-strong">Para que usamos</h2>
      <p>
        Para operar o feed por bairro, manter a segurança contra abuso, permitir a
        moderação e gerar estatísticas agregadas na página de transparência.
      </p>

      <h2 className="text-lg font-semibold text-text-strong">O que nunca é público</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>seu e-mail e telefone;</li>
        <li>a autoria de publicações e comentários marcados como anônimos;</li>
        <li>seus salvamentos e notificações.</li>
      </ul>

      <h2 className="text-lg font-semibold text-text-strong">Por quanto tempo guardamos</h2>
      <p>
        Enquanto sua conta existir. Ao encerrar a conta, seus dados são apagados e suas
        publicações permanecem sem autor identificado — permanecendo como registro da
        comunidade.
      </p>

      <h2 className="text-lg font-semibold text-text-strong">Seus direitos</h2>
      <p>
        Você pode consultar, corrigir e excluir seus dados a qualquer momento pelo próprio
        perfil, ou solicitando pelo canal de contato informado no rodapé do produto.
      </p>

      <p className="text-sm text-text-muted">
        Esta política é uma versão inicial alinhada ao produto em lançamento e será
        revisada com assessoria jurídica antes de operação em escala.
      </p>
    </article>
  );
}
