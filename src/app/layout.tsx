
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/app-header';

export const metadata: Metadata = {
  title: 'APS MUN VII - Verification',
  description: 'Find delegate and host team information quickly.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Teko:wght@700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="fixed inset-0 -z-20 h-full w-full bg-[radial-gradient(#1f3a2b_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <AppHeader />
        <main className="container mx-auto p-4 md:p-8 pt-24">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
