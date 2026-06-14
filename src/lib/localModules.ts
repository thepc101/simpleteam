'use client'

import { useEffect, useState } from 'react'
import { useApp } from './store'

/**
 * Lightweight per-workspace collection stored in localStorage. Used by the
 * self-contained modules (Invoicing, Inventory, Loans) so they work on any
 * backend with no extra setup. Cross-tab synced via the storage event.
 */
export function useCollection<T extends { id: string }>(name: string) {
  const { currentWorkspace } = useApp()
  const wsId = currentWorkspace?.id ?? 'none'
  const key = `simpleteam:mod:${wsId}:${name}`
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      setItems(raw ? (JSON.parse(raw) as T[]) : [])
    } catch {
      setItems([])
    }
    function onStorage(e: StorageEvent) {
      if (e.key === key) {
        try {
          setItems(e.newValue ? (JSON.parse(e.newValue) as T[]) : [])
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  function persist(next: T[]) {
    setItems(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* ignore quota */
    }
  }

  return {
    items,
    add: (item: T) => persist([item, ...items]),
    update: (id: string, patch: Partial<T>) =>
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    remove: (id: string) => persist(items.filter((i) => i.id !== id)),
  }
}

export const modId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)

export function inr(n: number): string {
  return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
