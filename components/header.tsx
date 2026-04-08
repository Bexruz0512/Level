"use client"

import { Sun, Moon } from 'lucide-react'

interface HeaderProps {
  pendingCount: number
  completedCount: number
  colorScheme: 'light' | 'dark'
  onToggleTheme: () => void
  onHaptic?: (type: 'light' | 'selection') => void
}

export function Header({ pendingCount, completedCount, colorScheme, onToggleTheme, onHaptic }: HeaderProps) {
  const totalCount = pendingCount + completedCount
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleToggle = () => {
    onHaptic?.('light')
    onToggleTheme()
  }

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Task Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pendingCount === 0
                ? totalCount === 0
                  ? 'Start adding tasks'
                  : 'All tasks completed!'
                : `${pendingCount} task${pendingCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            aria-label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {colorScheme === 'dark' ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
        
        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </header>
  )
}
