import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
});

export const metadata: Metadata = { 
  title: 'UMKN POS', 
  description: 'Point of Sale for SMEs' 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}