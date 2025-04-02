  import './globals.css';
  import { Inter } from 'next/font/google';
  import { AuthProvider } from './auth/AuthProvider'; 

  const inter = Inter({ subsets: ['latin'] });

  export const metadata = {
      title: 'Product Recommender',
      description: 'Welcome',
  };

  export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
          <html lang="en">
              <body className={inter.className}>
                  <AuthProvider>{children}</AuthProvider> {/* Wrap your app with AuthProvider */}
              </body>
          </html>
      );
  }

