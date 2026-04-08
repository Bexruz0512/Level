"use client"

import { useState } from 'react'
import { Check, Trash2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onHaptic?: (type: 'light' | 'success' | 'selection') => void
}

export function TaskItem({ task, onToggle, onDelete, onHaptic }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const date = new Date(deadline)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    const isPast = date < today && !isToday
    
    let text = ''
    if (isToday) {
      text = 'Today'
    } else if (isTomorrow) {
      text = 'Tomorrow'
    } else {
      text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    return { text, isPast, isToday }
  }

  const deadlineInfo = formatDeadline(task.deadline)

  const handleToggle = () => {
    onHaptic?.(task.completed ? 'light' : 'success')
    onToggle(task.id)
  }

  const handleDelete = () => {
    onHaptic?.('light')
    setIsDeleting(true)
    setTimeout(() => {
      onDelete(task.id)
    }, 200)
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-4 rounded-xl bg-card border border-border transition-all duration-200",
        task.completed && "opacity-60",
        isDeleting && "scale-95 opacity-0"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={cn(
          "mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          task.completed
            ? "bg-success border-success text-success-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {task.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-base font-medium text-foreground leading-snug transition-all duration-200",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        
        {deadlineInfo && !task.completed && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span
              className={cn(
                "text-xs font-medium",
                deadlineInfo.isPast
                  ? "text-destructive"
                  : deadlineInfo.isToday
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {deadlineInfo.text}
            </span>
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="flex-shrink-0 p-2 -m-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
