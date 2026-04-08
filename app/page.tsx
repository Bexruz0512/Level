"use client"

import { useTelegram } from '@/hooks/use-telegram'
import { useTasks } from '@/hooks/use-tasks'
import { Header } from '@/components/header'
import { AddTaskForm } from '@/components/add-task-form'
import { TaskList } from '@/components/task-list'
import { EmptyState } from '@/components/empty-state'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function TaskTrackerPage() {
  const { colorScheme, isReady, hapticFeedback, toggleTheme } = useTelegram()
  const { tasks, pendingTasks, completedTasks, isLoaded, addTask, toggleTask, deleteTask } = useTasks()
  const [showCompleted, setShowCompleted] = useState(true)

  // Show loading state while initializing
  if (!isReady || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header
        pendingCount={pendingTasks.length}
        completedCount={completedTasks.length}
        colorScheme={colorScheme}
        onToggleTheme={toggleTheme}
        onHaptic={hapticFeedback}
      />

      <div className="px-4 py-4 pb-8 space-y-6">
        {/* Add Task Form */}
        <AddTaskForm onAdd={addTask} onHaptic={hapticFeedback} />

        {/* Empty State */}
        {tasks.length === 0 && <EmptyState type="no-tasks" />}

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              To Do
            </h2>
            <TaskList
              tasks={pendingTasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onHaptic={hapticFeedback}
            />
          </section>
        )}

        {/* All done state */}
        {tasks.length > 0 && pendingTasks.length === 0 && (
          <EmptyState type="all-done" />
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section>
            <button
              onClick={() => {
                hapticFeedback('light')
                setShowCompleted(!showCompleted)
              }}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors"
            >
              <span>Completed ({completedTasks.length})</span>
              {showCompleted ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showCompleted && (
              <TaskList
                tasks={completedTasks}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onHaptic={hapticFeedback}
              />
            )}
          </section>
        )}
      </div>
    </main>
  )
}
