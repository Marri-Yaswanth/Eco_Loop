'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const dark = document.documentElement.classList.contains('dark')
    setIsDark(dark)
  }, [])

  function toggleTheme() {
    const nextDark = !isDark
    setIsDark(nextDark)
    document.documentElement.classList.toggle('dark', nextDark)
    localStorage.setItem('theme', nextDark ? 'dark' : 'light')
  }

  if (!mounted) {
    return <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Toggle theme" />
  }

  return (
    <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label="Toggle theme">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
