import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

export const metadata: Metadata = {
title: "Cortex Call | Inteligência Artificial para Clínicas Médicas",
  description: "Transforme vagas vazias em faturamento. A Cortex Call é uma I.A. especializada em recuperar pacientes clínicos via WhatsApp, zerar faltas e escalar os resultados financeiros do seu consultório de forma 100% automática.",
  keywords: "inteligência artificial clínica médica, recuperar pacientes consultório, software gestão clínica médica, chatbot whatsapp médicos, Cortex Call",

  openGraph: {
    title: "Cortex Call | I.A. para Clínicas Médicas",
    description: "Recupere faturamento oculto e reative pacientes antigos da sua clínica com campanhas automáticas da Cortex IA.",
    type: "website",
  },
  verification: {
    google: "K22rAHJbs_oDdYMvGFEFRuThozatrhP5CnW-9iDATcs",
  },
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ErrorBoundary>
          <Toaster position="top-right" />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
