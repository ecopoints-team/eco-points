import '../src/index.css';
import { Providers } from './providers';

export const metadata = {
  title: 'EcoPoints',
  description: 'EcoPoints Application',
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
