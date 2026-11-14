import { useEffect, useState } from 'react'

export function useStatusToast() {
  const [toast, set_toast] = useState<{ message: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => set_toast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  return {
    message: toast?.message ?? '',
    show: (message: string) => set_toast({ message }),
    clear: () => set_toast(null),
  }
}
