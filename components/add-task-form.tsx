"use client"

import { useState, useRef, useEffect } from 'react'
import { Plus, Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddTaskFormProps {
  onAdd: (title: string, deadline: string | null) => void
  onHaptic?: (type: 'light' | 'success' | 'selection') => void
}

export function AddTaskForm({ onAdd, onHaptic }: AddTaskFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onHaptic?.('success')
    onAdd(title, deadline || null)
    setTitle('')
    setDeadline('')
    setShowDatePicker(false)
    setIsExpanded(false)
  }

  const handleExpand = () => {
    onHaptic?.('light')
    setIsExpanded(true)
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setTitle('')
    setDeadline('')
    setShowDatePicker(false)
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border bg-card/50 hover:border-primary/50 hover:bg-card transition-all duration-200 text-muted-foreground hover:text-foreground"
      >
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <span className="text-base font-medium">Add a new task</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-6 h-6 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          autoComplete="off"
        />
      </div>

      {/* Deadline section */}
      <div className="flex items-center gap-2 pl-9">
        {showDatePicker ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={getMinDate()}
              className="flex-1 px-3 py-2 text-sm bg-secondary rounded-lg border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => {
                setShowDatePicker(false)
                setDeadline('')
              }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
              deadline
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>{deadline ? new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Add deadline'}</span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Task
        </button>
      </div>
    </form>
  )
}
