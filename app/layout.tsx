import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaalaman - AI Study Companion',
  description: 'AI-powered study companion tailored for Philippine students. Upload notes, ask questions in Tagalog or English, and get intelligent summaries, quizzes, and explanations.',
  keywords: ['study', 'AI', 'Philippine', 'Tagalog', 'education', 'learning'],
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Kaalaman',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Kaalaman - AI Study Companion',
    description: 'Smart study helper for Filipino students',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0f172a',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
