"use client"

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  ChevronDown, 
  ChevronUp, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Check, 
  ClipboardList, 
  PartyPopper 
} from 'lucide-react'

// ==================== TYPES ====================

type ColorScheme = 'light' | 'dark'
type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error'

interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  colorScheme: ColorScheme
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'success' | 'warning' | 'error') => void
    selectionChanged: () => void
  }
  onEvent: (eventType: string, callback: () => void) => void
  offEvent: (eventType: string, callback: () => void) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

// ==================== HOOKS ====================

const STORAGE_KEY = 'telegram-tasks'

function useTelegram() {
  const [isReady, setIsReady] = useState(false)
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light')

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg) {
      tg.ready()
      tg.expand()
      setColorScheme(tg.colorScheme || 'light')

      const handleThemeChange = () => {
        setColorScheme(tg.colorScheme || 'light')
      }

      tg.onEvent('themeChanged', handleThemeChange)
      setIsReady(true)

      return () => {
        tg.offEvent('themeChanged', handleThemeChange)
      }
    } else {
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

  const hapticFeedback = useCallback((type: HapticType) => {
    const tg = window.Telegram?.WebApp
    if (tg?.HapticFeedback) {
      if (['success', 'warning', 'error'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error')
      } else {
        tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft')
      }
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  return { isReady, colorScheme, hapticFeedback, toggleTheme }
}

function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setTasks(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      } catch (error) {
        console.error('Failed to save tasks:', error)
      }
    }
  }, [tasks, isLoaded])

  const addTask = useCallback((text: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    }
    setTasks(prev => [newTask, ...prev])
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const pendingTasks = useMemo(() => tasks.filter(task => !task.completed), [tasks])
  const completedTasks = useMemo(() => tasks.filter(task => task.completed), [tasks])

  return { tasks, pendingTasks, completedTasks, isLoaded, addTask, toggleTask, deleteTask }
}

// ==================== HELPER FUNCTIONS ====================

function getCurrentWeekDates() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  const formatDate = (date: Date) => {
    const day = date.getDate()
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]
    return `${day} ${months[date.getMonth()]}`
  }
  
  return { start: formatDate(monday), end: formatDate(sunday) }
}

function getMotivationalPhrase(completed: number): string {
  if (completed === 0) return 'Начни неделю мощно!'
  if (completed >= 1 && completed <= 5) return 'Хороший темп, не останавливайся!'
  if (completed >= 6 && completed <= 9) return 'Почти у цели! Финишная прямая!'
  return 'Ты легенда! Уровень пройден!'
}

// ==================== COMPONENTS ====================

function Header({ 
  pendingCount, 
  completedCount, 
  colorScheme, 
  onToggleTheme, 
  onHaptic 
}: {
  pendingCount: number
  completedCount: number
  colorScheme: ColorScheme
  onToggleTheme: () => void
  onHaptic: (type: HapticType) => void
}) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-semibold">
            <span className="text-foreground">Level</span>{' '}
            <span className="text-sky-400">Up</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{pendingCount}</span>
            <span>pending</span>
            <span className="mx-1 text-border">|</span>
            <span className="font-medium text-primary">{completedCount}</span>
            <span>done</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onHaptic('light')
              onToggleTheme()
            }}
            className="w-8 h-8 rounded-full"
          >
            {colorScheme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}

function AddTaskForm({ 
  onAdd, 
  onHaptic 
}: {
  onAdd: (text: string) => void
  onHaptic: (type: HapticType) => void
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAdd(text)
      setText('')
      onHaptic('success')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new task..."
        className="flex-1 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={!text.trim()}
        className="h-11 w-11 rounded-xl shrink-0 bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-500/50 disabled:text-white/70"
        onClick={() => text.trim() && onHaptic('light')}
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </Button>
    </form>
  )
}

function TaskList({ 
  tasks, 
  onToggle, 
  onDelete, 
  onHaptic 
}: {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onHaptic: (type: HapticType) => void
}) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
            task.completed 
              ? "bg-muted/30" 
              : "bg-muted/50 hover:bg-muted/70"
          )}
        >
          <button
            onClick={() => {
              onHaptic(task.completed ? 'light' : 'success')
              onToggle(task.id)
            }}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              task.completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40 hover:border-primary"
            )}
          >
            {task.completed && <Check className="w-3.5 h-3.5" />}
          </button>
          
          <span
            className={cn(
              "flex-1 text-sm transition-all",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.text}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onHaptic('warning')
              onDelete(task.id)
            }}
            className="w-8 h-8 text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ type }: { type: 'no-tasks' | 'all-done' }) {
  if (type === 'all-done') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <PartyPopper className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">All done!</h3>
        <p className="text-sm text-muted-foreground">
          Great job! You have completed all your tasks.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h3>
      <p className="text-sm text-muted-foreground">
        Add your first task to get started!
      </p>
    </div>
  )
}

// ==================== MAIN PAGE ====================

export default function TaskTrackerPage() {
  const { colorScheme, isReady, hapticFeedback, toggleTheme } = useTelegram()
  const { tasks, pendingTasks, completedTasks, isLoaded, addTask, toggleTask, deleteTask } = useTasks()
  const [showCompleted, setShowCompleted] = useState(true)

  const weekDates = useMemo(() => getCurrentWeekDates(), [])
  
  const completedCount = completedTasks.length
  const targetTasks = 10
  const progressValue = Math.min((completedCount / targetTasks) * 100, 100)
  const isGoalReached = completedCount >= targetTasks
  
  const motivation = useMemo(() => getMotivationalPhrase(completedCount), [completedCount])

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

      <div className="px-4 py-3 pb-8 space-y-4">
        {/* Compact Statistics Panel */}
        <div className={cn(
          "rounded-xl p-3 transition-all duration-300",
          isGoalReached 
            ? "bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 ring-1 ring-yellow-400/50" 
            : "bg-muted/50"
        )}>
          <div className="text-xs font-medium text-muted-foreground text-center mb-2">
            Неделя: {weekDates.start} - {weekDates.end}
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "text-sm font-semibold whitespace-nowrap",
              isGoalReached ? "text-yellow-700 dark:text-yellow-300" : "text-foreground"
            )}>
              {completedCount} / {targetTasks}
            </div>
            
            <div className="relative flex-1 h-2">
              <Progress 
                value={progressValue} 
                className={cn(
                  "h-2 rounded-full",
                  isGoalReached 
                    ? "bg-yellow-200 dark:bg-yellow-900/40" 
                    : "bg-muted"
                )}
              />
              <div 
                className="absolute inset-0 h-2 rounded-full overflow-hidden"
                style={{ width: `${progressValue}%` }}
              >
                <div className={cn(
                  "h-full w-full rounded-full",
                  isGoalReached 
                    ? "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 animate-shimmer" 
                    : "bg-primary"
                )} />
              </div>
            </div>
          </div>
          
          <div className={cn(
            "text-center mt-2",
            "text-xs font-medium",
            isGoalReached ? "text-yellow-700 dark:text-yellow-300" : "text-muted-foreground"
          )}>
            {motivation}
          </div>
        </div>

        <AddTaskForm onAdd={addTask} onHaptic={hapticFeedback} />

        {tasks.length === 0 && <EmptyState type="no-tasks" />}

        {pendingTasks.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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

        {tasks.length > 0 && pendingTasks.length === 0 && (
          <EmptyState type="all-done" />
        )}

        {completedTasks.length > 0 && (
          <section>
            <button
              onClick={() => {
                hapticFeedback('light')
                setShowCompleted(!showCompleted)
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
            >
              <span>Completed ({completedTasks.length})</span>
              {showCompleted ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
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
