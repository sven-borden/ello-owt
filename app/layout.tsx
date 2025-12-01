import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import './globals.css'

export const metadata: Metadata = {
  title: 'OWT Chess Elo Tracker',
  description: 'Internal chess Elo scoring system for OWT',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b border-gray-custom-300 bg-white">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="OWT Logo"
                  width={40}
                  height={40}
                  className="cursor-pointer"
                  priority
                />
                <h1 className="text-2xl font-bold text-brand-red hover:opacity-80 transition-opacity">
                  OWT Chess Elo
                </h1>
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-gray-custom-700 hover:text-brand-red transition-colors">
                  Dashboard
                </Link>
                <Link href="/matches" className="text-gray-custom-700 hover:text-brand-red transition-colors">
                  Matches
                </Link>
              </div>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-custom-300 bg-white mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-custom-600">
            © 2025 OWT Swiss - Internal Chess Elo Tracker
          </div>
        </footer>
      </body>
    </html>
  )
}
