import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2Lev Evolution",
  description: "Diagnóstico de marketing para entender onde sua empresa está e o que merece atenção.",
  robots: { index: false, follow: false }, // enquanto estiver em construção
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=DM+Sans:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
