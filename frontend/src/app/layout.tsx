import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'cardap.io — Cardápio Digital',
  description: 'Peça na mesa pelo seu celular. Sem fila, sem garçom.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
