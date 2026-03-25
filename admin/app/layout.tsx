import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { Toaster } from 'react-hot-toast'
import { ConditionalLayout } from '@/components/ConditionalLayout'

export const metadata: Metadata = {
  title: 'AniTap Admin',
  description: 'AniTap Game Administration Panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-gray-950 text-white">
        <QueryProvider>
          <AuthProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1F2937',
                  color: '#F9FAFB',
                  border: '1px solid #374151',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
