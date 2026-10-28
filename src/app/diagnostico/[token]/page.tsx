import { notFound } from "next/navigation";
import { ConfigError, getRepo } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu diagnóstico | 2Lev Evolution", robots: { index: false, follow: false } };

// Rascunho aberto pelo link com o token. As perguntas do diagnóstico entram na próxima etapa.
export default async function DiagnosticoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();

  let data;
  try {
    data = await (await getRepo()).getByToken(token);
  } catch (e) {
    if (e instanceof ConfigError) {
      return <main className="wrap"><p className="alert">Serviço indisponível no momento.</p></main>;
    }
    throw e;
  }
  if (!data) notFound();

  return (
    <main className="wrap">
      <p className="eyebrow">Passo 2 de 3</p>
      <h1>Cadastro recebido</h1>
      <p className="lede">
        As informações de {data.companyName} foram salvas. As perguntas do diagnóstico serão
        liberadas na próxima etapa do desenvolvimento.
      </p>
    </main>
  );
}
