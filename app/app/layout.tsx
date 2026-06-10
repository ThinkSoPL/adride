import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdRide — Panel',
  description: 'AdRide — marketplace reklamy mobilnej. Kampanie GPS, kierowcy, reklamodawcy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-gray-950">{children}</body>
    </html>
  );
}
