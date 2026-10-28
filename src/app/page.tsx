import Link from "next/link";

const DIMENSIONS = [
  { name: "Presença", text: "Se a empresa é encontrada e comunica o que oferece." },
  { name: "Atração", text: "Como os contatos chegam e de onde vêm." },
  { name: "Conversão", text: "O que acontece depois do primeiro contato." },
  { name: "Gestão", text: "Como os resultados são medidos e as decisões tomadas." },
];

export default function Home() {
  return (
    <main className="wrap">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p className="eyebrow">2Lev Evolution</p>
        <h1>Descubra onde o marketing da sua empresa está e o que merece atenção primeiro</h1>
        <p className="lede">
          Responda a algumas perguntas simples sobre o seu negócio. Você recebe um diagnóstico
          com os pontos fortes, as lacunas e as análises que valem a pena fazer. Não precisa
          conhecer termos técnicos de marketing.
        </p>
      </div>

      <section className="card" aria-labelledby="olha">
        <h2 id="olha">O que o diagnóstico olha</h2>
        <div className="dims" role="list">
          {DIMENSIONS.map((d) => (
            <div className="dim" role="listitem" key={d.name}>
              <i aria-hidden="true" />
              <b>{d.name}</b>
              <span>{d.text}</span>
            </div>
          ))}
        </div>
        <p className="small">Cada área é avaliada separadamente. Uma empresa pode estar bem em uma e precisar de atenção em outra.</p>
      </section>

      <section className="card" aria-labelledby="receber">
        <h2 id="receber">O que você recebe</h2>
        <ul className="list">
          <li>Um relatório automático, baseado nas suas respostas, com os pontos fortes e as áreas que merecem atenção.</li>
          <li>Uma indicação do que ainda não deu para avaliar, quando faltar informação.</li>
          <li>Sugestões de próximas análises. Nenhuma promessa de resultado.</li>
        </ul>
        <p className="small">
          O relatório é gerado automaticamente. Em alguns casos, a equipe da 2Lev pode convidar
          para uma análise personalizada, mas isso não é garantido a todos.
        </p>
        <p className="small">Tempo estimado: de 5 a 7 minutos.</p>
      </section>

      <div>
        <Link className="btn" href="/cadastro">Quero diagnosticar meu marketing</Link>
      </div>
    </main>
  );
}
