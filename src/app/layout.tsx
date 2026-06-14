import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'SimpleTeam — Task management, simplified',
  description: 'Asana, but simpler. Fast task management with roles, a backlog and a built-in Indian compliance reference.',
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
}

const themeScript = `
try {
  var t = localStorage.getItem('simpleteam:theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  var a = localStorage.getItem('simpleteam:accent');
  if (a) document.documentElement.setAttribute('data-accent', a);
} catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={{ fontFamily: 'var(--font-sans)' }}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
