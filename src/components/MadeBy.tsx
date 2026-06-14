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
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <a
        href="https://thepc101.github.io"
        target="_blank"
        rel="noreferrer"
        className="transition hover:text-slate-700 dark:hover:text-slate-300"
      >
        Made by <span className="font-semibold accent-text">thepc101</span>
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
        className="ml-0.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
