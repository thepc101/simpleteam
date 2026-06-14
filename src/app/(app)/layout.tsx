'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useApp } from '@/lib/store'
import { AppShell } from '@/components/AppShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, currentUser } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (ready && !currentUser) router.replace('/login')
  }, [ready, currentUser, router])

  if (!ready || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return <AppShell>{children}</AppShell>
}
