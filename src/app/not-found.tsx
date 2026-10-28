import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap">
      <h1>Página não encontrada</h1>
      <p className="lede">O link pode estar incompleto ou ter expirado.</p>
      <div><Link className="btn" href="/">Voltar ao início</Link></div>
    </main>
  );
}
