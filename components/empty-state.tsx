"use client"

import { CheckCircle2 } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-tasks' | 'all-done'
}

export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'all-done') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">All done!</h3>
        <p className="text-sm text-muted-foreground">
          You&apos;ve completed all your tasks. Great work!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h3>
      <p className="text-sm text-muted-foreground">
        Add your first task to get started
      </p>
    </div>
  )
}
