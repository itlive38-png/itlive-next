import './legacy.css';

export const metadata = {
  title: 'IT Live — Noutbuk nazorati',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-180.png' },
  appleWebApp: { capable: true, title: 'IT Live' },
  other: { 'mobile-web-app-capable': 'yes' },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0969da' };

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="lock" suppressHydrationWarning>{children}</body>
    </html>
  );
}
