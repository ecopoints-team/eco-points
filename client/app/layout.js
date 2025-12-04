import '../src/index.css';

export const metadata = {
  title: 'EcoPoints',
  description: 'EcoPoints Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
