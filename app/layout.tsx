import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Watchlist Roulette — Random Movie Picker for Letterboxd',
  description:
    'Spin the wheel and let fate decide what to watch tonight. Randomly pick a movie from your Letterboxd watchlist with Watchlist Roulette.',
  keywords: ['letterboxd', 'watchlist', 'random movie picker', 'movie roulette', 'what to watch'],
  openGraph: {
    title: 'Watchlist Roulette',
    description: 'Spin the wheel and let fate decide what to watch tonight.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watchlist Roulette',
    description: 'Spin the wheel and let fate decide what to watch tonight.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
