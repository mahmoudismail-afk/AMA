import type { Metadata, Viewport } from 'next';
import './globals.css';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#111827',
};

export const metadata: Metadata = {
  title: {
    default: 'AMA GYM — Management System',
    template: '%s | AMA GYM',
  },
  description:
    'A modern gym management system to manage members, classes, trainers, payments, and more.',
  keywords: ['gym', 'management', 'fitness', 'members', 'classes'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Blocking script: sets data-theme BEFORE paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('ama-theme');document.documentElement.setAttribute('data-theme',t||'dark');})();`,
          }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
