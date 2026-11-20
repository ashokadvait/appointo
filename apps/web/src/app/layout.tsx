import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Appointo — Modern Scheduling & Automated Follow-Ups',
  description: 'Enterprise-grade customizable scheduling engine with dynamic slot computation and automated 4-stage follow-up workflows.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%233b82f6'/><path d='M8 12h16M11 8v4M21 8v4M8 16h16M8 20h10' stroke='white' stroke-width='2' stroke-linecap='round'/></svg>",
  },
};

import { DialogProvider } from '@/components/ui/dialog-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
