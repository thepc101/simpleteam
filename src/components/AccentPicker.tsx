'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCENTS = [
  { key: 'indigo', color: '#4f46e5', label: 'Indigo' },
  { key: 'violet', color: '#7c3aed', label: 'Violet' },
  { key: 'blue', color: '#2563eb', label: 'Blue' },
  { key: 'teal', color: '#0d9488', label: 'Teal' },
  { key: 'emerald', color: '#059669', label: 'Emerald' },
  { key: 'rose', color: '#e11d48', label: 'Rose' },
  { key: 'amber', color: '#d97706', label: 'Amber' },
]

export function AccentPicker() {
  const [accent, setAccent] = useState('indigo')

  useEffect(() => {
    setAccent(document.documentElement.getAttribute('data-accent') || 'indigo')
  }, [])

  function pick(key: string) {
    setAccent(key)
    document.documentElement.setAttribute('data-accent', key)
    try {
      localStorage.setItem('simpleteam:accent', key)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {ACCENTS.map((a) => (
        <button
          key={a.key}
          onClick={() => pick(a.key)}
          title={a.label}
          aria-label={`Use ${a.label} accent`}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition hover:scale-105 dark:ring-offset-slate-900',
            accent === a.key ? 'ring-slate-400 dark:ring-slate-500' : 'ring-transparent',
          )}
          style={{ backgroundColor: a.color }}
        >
          {accent === a.key && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  )
}
