"use client"

import { useEffect, useState, useCallback } from 'react'

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    setText: (text: string) => void
  }
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  colorScheme: 'light' | 'dark'
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    
    if (tg) {
      setWebApp(tg)
      setColorScheme(tg.colorScheme || 'light')
      tg.ready()
      tg.expand()
      setIsReady(true)
    } else {
      // Fallback for non-Telegram environment
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setColorScheme(prefersDark ? 'dark' : 'light')
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [colorScheme])

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (!webApp?.HapticFeedback) return
    
    if (type === 'selection') {
      webApp.HapticFeedback.selectionChanged()
    } else if (['success', 'error', 'warning'].includes(type)) {
      webApp.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning')
    } else {
      webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy')
    }
  }, [webApp])

  const toggleTheme = useCallback(() => {
    setColorScheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  return {
    webApp,
    colorScheme,
    isReady,
    hapticFeedback,
    toggleTheme,
    user: webApp?.initDataUnsafe?.user,
  }
}
