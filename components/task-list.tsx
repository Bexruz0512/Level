"use client"

import { TaskItem } from './task-item'
import type { Task } from '@/types/task'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onHaptic?: (type: 'light' | 'success' | 'selection') => void
}

export function TaskList({ tasks, onToggle, onDelete, onHaptic }: TaskListProps) {
  if (tasks.length === 0) return null

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onHaptic={onHaptic}
        />
      ))}
    </div>
  )
}
