import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AMS',
  description: 'Assignment and Submission Management System',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
