import { Providers } from '@/components/providers';
import './globals.css';

export const metadata = {
  title: 'KTM Digital - Blockchain Verified Student ID',
  description: 'Sistem Kartu Tanda Mahasiswa Digital berbasis Verifiable Credential dan Blockchain',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
