import CompanyForm from "./CompanyForm";

export const metadata = { title: "Sobre a sua empresa | 2Lev Evolution" };

export default function CadastroPage() {
  return (
    <main className="wrap">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="eyebrow">Passo 1 de 3</p>
        <h1>Conte um pouco sobre a sua empresa</h1>
        <p className="lede">
          Estas informações ajudam a entender o contexto antes das perguntas do diagnóstico.
          Só o que está marcado como obrigatório é necessário.
        </p>
      </div>
      <CompanyForm />
    </main>
  );
}
