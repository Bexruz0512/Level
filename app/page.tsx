"use client"

import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent, type TouchEvent } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  Moon, 
  Sun, 
  Plus, 
  Trash2, 
  Check, 
  ClipboardList, 
  PartyPopper,
  ListTodo,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import confetti from 'canvas-confetti'

// ==================== TYPES ====================

type ColorScheme = 'light' | 'dark'
type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error'
type TabType = 'tasks' | 'stats'
type Language = 'en' | 'ru'

interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
  completedAt?: number
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

// ==================== TRANSLATIONS ====================

const translations = {
  en: {
    pending: 'pending',
    done: 'done',
    addTask: 'Add a task...',
    toDo: 'TO DO',
    completed: 'Completed',
    allDone: 'All done!',
    allDoneDesc: 'Great job! You have completed all your tasks.',
    noTasks: 'No tasks yet',
    noTasksDesc: 'Add your first task to get started!',
    loading: 'Loading...',
    tasks: 'Tasks',
    stats: 'Stats',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    noData: 'No data',
    weekNotPassed: 'Week not over yet',
    monthNotPassed: 'Month not over yet',
    motivation0: 'Start the week strong!',
    motivation1: 'Good pace, keep going!',
    motivation6: 'Almost there! Final stretch!',
    motivation10: 'Legend! Level complete!'
  },
  ru: {
    pending: 'ожидают',
    done: 'готово',
    addTask: 'Добавить задачу...',
    toDo: 'СДЕЛАТЬ',
    completed: 'Выполнено',
    allDone: 'Всё готово!',
    allDoneDesc: 'Отличная работа! Вы выполнили все задачи.',
    noTasks: 'Задач пока нет',
    noTasksDesc: 'Добавьте первую задачу!',
    loading: 'Загрузка...',
    tasks: 'Задачи',
    stats: 'Статистика',
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    noData: 'Нет данных',
    weekNotPassed: 'Неделя ещё не прошла',
    monthNotPassed: 'Месяц ещё не прошёл',
    motivation0: 'Начни неделю мощно!',
    motivation1: 'Хороший темп, не останавливайся!',
    motivation6: 'Почти у цели! Финишная прямая!',
    motivation10: 'Ты легенда! Уровень пройден!'
  }
}

// ==================== HOOKS ====================

const STORAGE_KEY = 'telegram-tasks'
const LANG_KEY = 'telegram-tasks-lang'

function useTelegram() {
  const [isReady, setIsReady] = useState(false)
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark')

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg) {
      tg.ready()
      tg.expand()
      setColorScheme(tg.colorScheme || 'dark')

      const handleThemeChange = () => {
        setColorScheme(tg.colorScheme || 'dark')
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
        task.id === id 
          ? { 
              ...task, 
              completed: !task.completed,
              completedAt: !task.completed ? Date.now() : undefined 
            } 
          : task
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

function useLanguage() {
  const [lang, setLang] = useState<Language>('ru')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY) as Language | null
      if (stored && (stored === 'en' || stored === 'ru')) {
        setLang(stored)
      }
    } catch (error) {
      console.error('Failed to load language:', error)
    }
  }, [])

  const toggleLanguage = useCallback((newLang: Language) => {
    setLang(newLang)
    try {
      localStorage.setItem(LANG_KEY, newLang)
    } catch (error) {
      console.error('Failed to save language:', error)
    }
  }, [])

  return { lang, toggleLanguage, t: translations[lang] }
}

// ==================== HELPER FUNCTIONS ====================

function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    
    // Modern soft "pop" sound with harmonics
    const mainOsc = audioContext.createOscillator()
    const subOsc = audioContext.createOscillator()
    const mainGain = audioContext.createGain()
    const subGain = audioContext.createGain()
    const filter = audioContext.createBiquadFilter()
    
    // Configure filter for warmth
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, audioContext.currentTime)
    filter.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15)
    
    // Main tone - soft sine
    mainOsc.type = 'sine'
    mainOsc.frequency.setValueAtTime(880, audioContext.currentTime)
    mainOsc.frequency.exponentialRampToValueAtTime(1100, audioContext.currentTime + 0.08)
    
    // Sub tone for depth
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(440, audioContext.currentTime)
    
    // Envelope
    mainGain.gain.setValueAtTime(0, audioContext.currentTime)
    mainGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
    mainGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15)
    
    subGain.gain.setValueAtTime(0, audioContext.currentTime)
    subGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
    subGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12)
    
    // Connect
    mainOsc.connect(mainGain)
    subOsc.connect(subGain)
    mainGain.connect(filter)
    subGain.connect(filter)
    filter.connect(audioContext.destination)
    
    mainOsc.start(audioContext.currentTime)
    subOsc.start(audioContext.currentTime)
    mainOsc.stop(audioContext.currentTime + 0.2)
    subOsc.stop(audioContext.currentTime + 0.15)
  } catch (e) {
    console.log('Audio not supported')
  }
}

function playVictorySound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    
    // Modern achievement sound - ascending shimmer
    const playChime = (freq: number, time: number, pan: number) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      const panner = audioContext.createStereoPanner()
      const filter = audioContext.createBiquadFilter()
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(freq * 2, audioContext.currentTime + time)
      filter.Q.setValueAtTime(2, audioContext.currentTime + time)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + time)
      
      panner.pan.setValueAtTime(pan, audioContext.currentTime + time)
      
      gain.gain.setValueAtTime(0, audioContext.currentTime + time)
      gain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + time + 0.4)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(panner)
      panner.connect(audioContext.destination)
      
      osc.start(audioContext.currentTime + time)
      osc.stop(audioContext.currentTime + time + 0.5)
    }
    
    // Ascending shimmer chord
    playChime(523.25, 0, -0.5)      // C5 left
    playChime(659.25, 0.05, 0)     // E5 center
    playChime(783.99, 0.1, 0.5)    // G5 right
    playChime(1046.50, 0.15, 0)    // C6 center
    playChime(1318.51, 0.2, 0)     // E6 center (sparkle)
    
  } catch (e) {
    console.log('Audio not supported')
  }
}

function fireConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.2, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  fire(0.1, { spread: 120, startVelocity: 45 })
}

function getMotivationalPhrase(completed: number, t: typeof translations['en']): string {
  if (completed === 0) return t.motivation0
  if (completed >= 1 && completed <= 5) return t.motivation1
  if (completed >= 6 && completed <= 9) return t.motivation6
  return t.motivation10
}

// ==================== STATISTICS HELPERS ====================

function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function calculateStats(tasks: Task[]) {
  const now = new Date()
  const startOfDay = getStartOfDay(now)
  const startOfWeek = getStartOfWeek(now)
  const startOfMonth = getStartOfMonth(now)
  
  // Tasks created today
  const todayTasks = tasks.filter(t => t.createdAt >= startOfDay.getTime())
  const todayCompleted = todayTasks.filter(t => t.completed).length
  const todayTotal = todayTasks.length
  
  // Tasks created this week
  const weekTasks = tasks.filter(t => t.createdAt >= startOfWeek.getTime())
  const weekCompleted = weekTasks.filter(t => t.completed).length
  const weekTotal = weekTasks.length
  
  // Tasks created this month
  const monthTasks = tasks.filter(t => t.createdAt >= startOfMonth.getTime())
  const monthCompleted = monthTasks.filter(t => t.completed).length
  const monthTotal = monthTasks.length
  
  // Check if week/month has passed (at least 7/30 days since start)
  const daysPassed = Math.floor((now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24))
  const weekPassed = daysPassed >= 7
  
  const monthDaysPassed = Math.floor((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
  const monthPassed = monthDaysPassed >= 28
  
  return {
    day: { completed: todayCompleted, total: todayTotal },
    week: { completed: weekCompleted, total: weekTotal, passed: weekPassed },
    month: { completed: monthCompleted, total: monthTotal, passed: monthPassed }
  }
}

// ==================== COMPONENTS ====================

function LanguageSelector({ 
  lang, 
  onToggle 
}: { 
  lang: Language
  onToggle: (lang: Language) => void 
}) {
  return (
    <div className="flex items-center gap-0.5 text-[10px] font-bold">
      <button
        onClick={() => onToggle('en')}
        className={cn(
          "flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors",
          lang === 'en' ? "bg-sky-500/20 text-sky-400" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/20">
          <svg viewBox="0 0 60 30" className="w-full h-full">
            <clipPath id="gb-clip">
              <circle cx="30" cy="15" r="15" />
            </clipPath>
            <g clipPath="url(#gb-clip)">
              <rect fill="#012169" width="60" height="30"/>
              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#gb-stripe)"/>
              <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
              <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
            </g>
          </svg>
        </div>
        <span>EN</span>
      </button>
      <span className="text-muted-foreground/50">|</span>
      <button
        onClick={() => onToggle('ru')}
        className={cn(
          "flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors",
          lang === 'ru' ? "bg-sky-500/20 text-sky-400" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/20">
          <svg viewBox="0 0 9 6" className="w-full h-full">
            <rect fill="#fff" width="9" height="3"/>
            <rect fill="#0039A6" y="2" width="9" height="2"/>
            <rect fill="#D52B1E" y="4" width="9" height="2"/>
          </svg>
        </div>
        <span>RU</span>
      </button>
    </div>
  )
}

function Header({ 
  colorScheme, 
  onToggleTheme, 
  onHaptic,
  lang,
  onToggleLang
}: {
  colorScheme: ColorScheme
  onToggleTheme: () => void
  onHaptic: (type: HapticType) => void
  lang: Language
  onToggleLang: (lang: Language) => void
}) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-lg font-extrabold">
          <span className="text-foreground">Level</span>{' '}
          <span className="text-sky-400">Up</span>
        </span>
        
        <div className="flex items-center gap-1">
          <LanguageSelector lang={lang} onToggle={onToggleLang} />
          
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
  onHaptic,
  t
}: {
  onAdd: (text: string) => void
  onHaptic: (type: HapticType) => void
  t: typeof translations['en']
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

  const hasText = text.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.addTask}
        className={cn(
          "flex-1 h-11 rounded-xl bg-muted/50 font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-500",
          hasText 
            ? "border-2 border-sky-500" 
            : "border-2 border-sky-800/50 dark:border-sky-900/60"
        )}
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={!hasText}
        className={cn(
          "h-11 w-11 rounded-xl shrink-0 transition-all duration-200 text-white border-2",
          hasText 
            ? "bg-sky-500 hover:bg-sky-600 border-sky-500" 
            : "bg-transparent border-sky-800/50 dark:border-sky-900/60 text-sky-800/50 dark:text-sky-900/60 cursor-not-allowed"
        )}
        onClick={() => hasText && onHaptic('light')}
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
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-muted-foreground/40 hover:border-emerald-500"
            )}
          >
            {task.completed && <Check className="w-3.5 h-3.5" />}
          </button>
          
          <span
            className={cn(
              "flex-1 text-sm font-bold transition-all",
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

function EmptyState({ type, t }: { type: 'no-tasks' | 'all-done', t: typeof translations['en'] }) {
  if (type === 'all-done') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <PartyPopper className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-extrabold text-foreground mb-1">{t.allDone}</h3>
        <p className="text-sm font-bold text-muted-foreground">
          {t.allDoneDesc}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <ClipboardList className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-extrabold text-foreground mb-1">{t.noTasks}</h3>
      <p className="text-sm font-bold text-muted-foreground">
        {t.noTasksDesc}
      </p>
    </div>
  )
}

function ProgressRing({ 
  percentage, 
  color, 
  label, 
  completed, 
  total,
  notPassedText 
}: { 
  percentage: number
  color: string
  label: string
  completed: number
  total: number
  notPassedText?: string
}) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const showNotPassed = notPassedText && total === 0

  return (
    <div className="flex flex-col items-center gap-2 min-w-[140px]">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/50"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showNotPassed ? (
            <span className="text-xs font-bold text-muted-foreground text-center px-2">{notPassedText}</span>
          ) : total === 0 ? (
            <span className="text-lg font-extrabold text-muted-foreground">0%</span>
          ) : (
            <>
              <span className="text-2xl font-extrabold" style={{ color }}>{percentage}%</span>
              <span className="text-xs font-bold text-muted-foreground">{completed}/{total}</span>
            </>
          )}
        </div>
      </div>
      <span className="text-sm font-extrabold text-foreground">{label}</span>
    </div>
  )
}

function StatsCarousel({ tasks, t }: { tasks: Task[], t: typeof translations['en'] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const stats = useMemo(() => calculateStats(tasks), [tasks])

  const rings = [
    {
      label: t.day,
      color: '#10b981',
      percentage: stats.day.total > 0 ? Math.round((stats.day.completed / stats.day.total) * 100) : 0,
      completed: stats.day.completed,
      total: stats.day.total,
      notPassedText: stats.day.total === 0 ? t.noData : undefined
    },
    {
      label: t.week,
      color: '#3b82f6',
      percentage: stats.week.total > 0 ? Math.round((stats.week.completed / stats.week.total) * 100) : 0,
      completed: stats.week.completed,
      total: stats.week.total,
      notPassedText: stats.week.total === 0 ? t.noData : undefined
    },
    {
      label: t.month,
      color: '#8b5cf6',
      percentage: stats.month.total > 0 ? Math.round((stats.month.completed / stats.month.total) * 100) : 0,
      completed: stats.month.completed,
      total: stats.month.total,
      notPassedText: stats.month.total === 0 ? t.noData : undefined
    }
  ]

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex < rings.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else if (diff < 0 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
      }
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  const goToNext = () => {
    if (currentIndex < rings.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        disabled={currentIndex === 0}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-muted/80 transition-opacity",
          currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-muted"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <button
        onClick={goToNext}
        disabled={currentIndex === rings.length - 1}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-muted/80 transition-opacity",
          currentIndex === rings.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-muted"
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel Container */}
      <div 
        className="overflow-hidden px-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {rings.map((ring, index) => (
            <div key={index} className="w-full flex-shrink-0 flex justify-center py-4">
              <ProgressRing
                percentage={ring.percentage}
                color={ring.color}
                label={ring.label}
                completed={ring.completed}
                total={ring.total}
                notPassedText={ring.notPassedText}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {rings.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex 
                ? "bg-sky-500 w-4" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  )
}

function BottomNav({ 
  activeTab, 
  onTabChange, 
  onHaptic,
  t
}: { 
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onHaptic: (type: HapticType) => void
  t: typeof translations['en']
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-20">
      <div className="flex items-center justify-around py-1.5 px-4 max-w-lg mx-auto">
        <button
          onClick={() => {
            onHaptic('light')
            onTabChange('tasks')
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all",
            activeTab === 'tasks' 
              ? "text-sky-500 bg-sky-500/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListTodo className="w-4 h-4" />
          <span className="text-[10px] font-extrabold">{t.tasks}</span>
        </button>
        
        <button
          onClick={() => {
            onHaptic('light')
            onTabChange('stats')
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all",
            activeTab === 'stats' 
              ? "text-sky-500 bg-sky-500/10" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] font-extrabold">{t.stats}</span>
        </button>
      </div>
    </nav>
  )
}

// ==================== MAIN PAGE ====================

export default function TaskTrackerPage() {
  const { colorScheme, isReady, hapticFeedback, toggleTheme } = useTelegram()
  const { tasks, pendingTasks, completedTasks, isLoaded, addTask, toggleTask, deleteTask } = useTasks()
  const { lang, toggleLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [prevAllDone, setPrevAllDone] = useState(false)
  
  const completedCount = completedTasks.length
  const totalTasks = tasks.length
  const progressValue = totalTasks > 0 ? Math.min((completedCount / totalTasks) * 100, 100) : 0
  
  const allDone = tasks.length > 0 && pendingTasks.length === 0
  
  const motivation = useMemo(() => getMotivationalPhrase(completedCount, t), [completedCount, t])

  // Play success sound when task is completed
  const handleToggleTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task && !task.completed) {
      playSuccessSound()
    }
    toggleTask(id)
  }, [tasks, toggleTask])

  // Fire confetti when all tasks are done
  useEffect(() => {
    if (allDone && !prevAllDone && tasks.length > 0) {
      fireConfetti()
      playVictorySound()
    }
    setPrevAllDone(allDone)
  }, [allDone, prevAllDone, tasks.length])

  // Navigate to stats when clicking on progress panel
  const handleProgressClick = () => {
    hapticFeedback('light')
    setActiveTab('stats')
  }

  if (!isReady || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header
        colorScheme={colorScheme}
        onToggleTheme={toggleTheme}
        onHaptic={hapticFeedback}
        lang={lang}
        onToggleLang={toggleLanguage}
      />

      {activeTab === 'tasks' && (
        <div className="px-4 py-3 space-y-4">
          {/* Compact Statistics Panel - Clickable */}
          <button
            onClick={handleProgressClick}
            className="w-full rounded-xl p-3 bg-muted/50 hover:bg-muted/70 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-foreground">
                  {new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { 
                    weekday: 'short' 
                  })}
                </span>
              </div>
              
              <div className="text-3xl font-extrabold text-emerald-500 whitespace-nowrap">
                {totalTasks > 0 ? Math.round(progressValue) : 0}%
              </div>
            </div>
            
            <div className="relative h-2 mt-2 rounded-full bg-muted">
              <div 
                className="absolute inset-y-0 left-0 h-2 rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            
            <div className="text-center mt-2 text-xs font-bold text-muted-foreground">
              {motivation}
            </div>
          </button>

          <AddTaskForm onAdd={addTask} onHaptic={hapticFeedback} t={t} />

          {tasks.length === 0 && <EmptyState type="no-tasks" t={t} />}

          {pendingTasks.length > 0 && (
            <section>
              <TaskList
                tasks={pendingTasks}
                onToggle={handleToggleTask}
                onDelete={deleteTask}
                onHaptic={hapticFeedback}
              />
            </section>
          )}

          {allDone && <EmptyState type="all-done" t={t} />}

          {completedTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                {t.completed} ({completedTasks.length})
              </h2>
              <TaskList
                tasks={completedTasks}
                onToggle={handleToggleTask}
                onDelete={deleteTask}
                onHaptic={hapticFeedback}
              />
            </section>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="px-4 py-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold">{t.stats}</h2>
            <p className="text-sm font-bold text-muted-foreground mt-1">
              {new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <StatsCarousel tasks={tasks} t={t} />
        </div>
      )}

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onHaptic={hapticFeedback}
        t={t}
      />
    </main>
  )
}
