import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vendor Event Booking',
  description: 'Book your vendor booth at upcoming events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

