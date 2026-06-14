'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export function MadeBy() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem('simpleteam:madeby') === 'hidden')
  }, [])

  if (hidden) return null

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs shadow-sm backdrop-blur" style={{ color: 'var(--fg-muted)' }}>
      <a
        href="https://thepc101.github.io"
        target="_blank"
        rel="noreferrer"
        className="transition hover:opacity-80"
        style={{ color: 'var(--fg)' }}
      >
        Made by <span className="font-semibold">thepc101</span>
      </a>
      <button
        onClick={() => {
          setHidden(true)
          try {
            localStorage.setItem('simpleteam:madeby', 'hidden')
          } catch {
            /* ignore */
          }
        }}
        className="ml-0.5 transition hover:opacity-70"
        style={{ color: 'var(--fg-subtle)' }}
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
