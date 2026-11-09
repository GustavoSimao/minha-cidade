import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-text-body">
      <h1 className="text-2xl font-bold text-text-strong">Termos de uso</h1>
      <p className="text-sm text-text-muted">Última atualização: 10 de outubro de 2026.</p>

      <p>
        O Minha Cidade é um espaço de participação cidadã organizado por bairro. Ao criar
        uma conta você concorda com as regras abaixo.
      </p>

      <h2 className="text-lg font-semibold text-text-strong">O que é proibido publicar</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>conteúdo ilegal, discriminatório, de assédio ou ameaça;</li>
        <li>dados pessoais de terceiros sem consentimento (nome completo, endereço, telefone, documento);</li>
        <li>informações falsas apresentadas como fato, spam e divulgação comercial;</li>
        <li>conteúdo que exponha crianças e adolescentes.</li>
      </ul>

      <h2 className="text-lg font-semibold text-text-strong">Sua conta</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>você é responsável pelo uso da sua conta e por mantê-la segura;</li>
        <li>
          você pode encerrar sua conta a qualquer momento em <code>/perfil/editar</code>:
          seus dados são apagados e suas publicações permanecem sem autor identificado.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-text-strong">Moderação</h2>
      <p>
        Conteúdo denunciado continua visível até a análise da moderação. A moderação pode
        ocultar ou remover publicações, comentários e perfis que violem estes termos, e
        pode restringir contas em caso de abuso.
      </p>

      <h2 className="text-lg font-semibold text-text-strong">Limites de uso</h2>
      <p>
        Para manter o feed utilizável, existem limites por hora e por dia para publicações,
        comentários e denúncias. Ao atingir um limite, o sistema informa quando você poderá
        tentar novamente.
      </p>

      <p className="text-sm text-text-muted">
        Este texto é uma versão inicial, escrita para o lançamento do produto, e não
        substitui assessoria jurídica.
      </p>
    </article>
  );
}
