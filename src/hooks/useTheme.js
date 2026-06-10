import { useState, useEffect } from 'react'

function getLocalHour() {
  return new Date().getHours()
}

function getAutoTheme() {
  const h = getLocalHour()
  return (h >= 19 || h < 6) ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme-override')
    return stored || getAutoTheme()
  })
  const [isManual, setIsManual] = useState(() => !!localStorage.getItem('theme-override'))

  // Apply theme to body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light')
    } else {
      document.body.classList.remove('light')
    }
  }, [theme])

  // Auto-switch check every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isManual) {
        setTheme(getAutoTheme())
      }
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [isManual])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setIsManual(true)
    localStorage.setItem('theme-override', next)
  }

  function resetToAuto() {
    setIsManual(false)
    localStorage.removeItem('theme-override')
    setTheme(getAutoTheme())
  }

  return { theme, toggle, isManual, resetToAuto }
}

