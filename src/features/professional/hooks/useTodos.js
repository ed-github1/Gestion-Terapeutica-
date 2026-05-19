import { useState, useEffect, useCallback } from 'react'
import { todoService } from '@shared/services'

export function useTodos() {
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        todoService.getAll()
            .then(res => setTodos(res.data ?? []))
            .catch(() => setError('No se pudieron cargar las tareas'))
            .finally(() => setLoading(false))
    }, [])

    const addTodo = useCallback(async (title) => {
        const temp = { id: `temp-${Date.now()}`, title, completed: false, createdAt: new Date().toISOString() }
        setTodos(prev => [temp, ...prev])
        try {
            const res = await todoService.create({ title })
            const created = res.data
            setTodos(prev => prev.map(t => t.id === temp.id ? created : t))
        } catch {
            setTodos(prev => prev.filter(t => t.id !== temp.id))
        }
    }, [])

    const toggleDone = useCallback(async (id, currentCompleted) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t))
        try {
            await todoService.update(id, { completed: !currentCompleted })
        } catch {
            setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: currentCompleted } : t))
        }
    }, [])

    const deleteTodo = useCallback(async (id) => {
        let removed
        setTodos(prev => {
            removed = prev.find(t => t.id === id)
            return prev.filter(t => t.id !== id)
        })
        try {
            await todoService.remove(id)
        } catch {
            if (removed) setTodos(prev => [removed, ...prev])
        }
    }, [])

    const clearDone = useCallback(async () => {
        let cleared
        setTodos(prev => {
            cleared = prev.filter(t => t.completed)
            return prev.filter(t => !t.completed)
        })
        try {
            await Promise.all(cleared.map(t => todoService.remove(t.id)))
        } catch {
            if (cleared?.length) setTodos(prev => [...prev, ...cleared])
        }
    }, [])

    return { todos, loading, error, addTodo, toggleDone, deleteTodo, clearDone }
}
