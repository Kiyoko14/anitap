import type { Metadata } from 'next'
import './globals.css'
import TelegramProvider from '@/providers/TelegramProvider'
import BottomNav from '@/components/BottomNav'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'AniTap',
  description: 'Tap to earn anime-style game on Telegram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-gray-950 text-white min-h-screen">
        <TelegramProvider>
          <main className="max-w-sm mx-auto min-h-screen pb-20">
            {children}
          </main>
          <BottomNav />
        </TelegramProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#a855f7',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
