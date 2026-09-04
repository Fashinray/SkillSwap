import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkillSwap — Peer Skill Exchange for OAU Students',
  description:
    'Exchange skills with fellow students using time credits. No money required.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f8f9ff] text-[#0b1c30] font-['Inter']">{children}</body>
    </html>
  )
}
