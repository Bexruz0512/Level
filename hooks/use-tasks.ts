"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Task } from '@/types/task'

const STORAGE_KEY = 'telegram-task-tracker'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load tasks from localStorage on mount
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

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      } catch (error) {
        console.error('Failed to save tasks:', error)
      }
    }
  }, [tasks, isLoaded])

  const addTask = useCallback((title: string, deadline: string | null) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      deadline,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => [newTask, ...prev])
    return newTask
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

  const updateTask = useCallback((id: string, updates: Partial<Pick<Task, 'title' | 'deadline'>>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    )
  }, [])

  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return {
    tasks,
    pendingTasks,
    completedTasks,
    isLoaded,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
  }
}
