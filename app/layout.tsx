import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal | Tea Cottage CMS',
  description: 'Multi-Site CMS Management Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 font-sans text-slate-100 antialiased selection:bg-tea-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
