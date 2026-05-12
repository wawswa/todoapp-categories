import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Button } from '#/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { CategoryNav } from '#/components/CategoryNav'
import { TodoItem } from '#/components/TodoItem'
import { TodoForm } from '#/components/TodoForm'
import { SearchBar } from '#/components/SearchBar'
import { FilterBar } from '#/components/FilterBar'
import {
  getCategories,
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoStatus,
  createCategory,
} from '#/routes/api/-todos'
import type { Todo, CreateTodoInput, UpdateTodoInput, Category } from '#/lib/types'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      categoryId:
        typeof search.categoryId === 'number' ? search.categoryId : undefined,
      priority:
        typeof search.priority === 'string' ? search.priority : undefined,
      search: typeof search.search === 'string' ? search.search : undefined,
    }
  },
  loader: async () => {
    try {
      const categories = await getCategories()
      return { categories }
    } catch (e) {
      console.error('Failed to load categories:', e)
      return { categories: [] }
    }
  },
  component: Home,
})

async function getTodosFn(params: {
  categoryId?: number | null
  priority?: string | null
  search?: string
}) {
  const data = {
    categoryId: params.categoryId ? String(params.categoryId) : null,
    priority: params.priority,
    search: params.search,
  }
  return getTodos({ data })
}

async function createTodoFn(data: CreateTodoInput) {
  return createTodo({ data })
}

async function updateTodoFn(data: UpdateTodoInput & { id: number }) {
  return updateTodo({ data })
}

async function deleteTodoFn(id: number) {
  return deleteTodo({ data: { id } })
}

async function toggleTodoFn(id: number, status: 'pending' | 'completed') {
  return toggleTodoStatus({ data: { id, status } })
}

async function createCategoryFn(data: { name: string; color: string; icon: string }) {
  return createCategory({ data })
}

function Home() {
  const searchParams = Route.useSearch()
  const loaderData = Route.useLoaderData()
  const queryClient = useQueryClient()

  const [localCategories, setLocalCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(searchParams.search || '')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  useEffect(() => {
    setLocalCategories(loaderData.categories)
  }, [loaderData.categories])

  useEffect(() => {
    setLocalSearch(searchParams.search || '')
  }, [searchParams.search])

  const todosQuery = useQuery({
    queryKey: ['todos', searchParams.categoryId, searchParams.priority, localSearch],
    queryFn: () => getTodosFn({
      categoryId: searchParams.categoryId ?? null,
      priority: searchParams.priority ?? null,
      search: localSearch,
    }),
    retry: 2,
    retryDelay: 2000,
  })

  const createMutation = useMutation({
    mutationFn: createTodoFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setIsFormOpen(false)
      setEditingTodo(null)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create todo')
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTodoFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setIsFormOpen(false)
      setEditingTodo(null)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update todo')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTodoFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to delete todo')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (data: { id: number; status: 'pending' | 'completed' }) => toggleTodoFn(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to toggle todo')
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: createCategoryFn,
    onSuccess: (newCategory) => {
      setLocalCategories(prev => [...prev, newCategory])
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create category')
    },
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchParams.search) {
        const params = new URLSearchParams(window.location.search)
        if (localSearch) {
          params.set('search', localSearch)
        } else {
          params.delete('search')
        }
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString() || ''}`)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, searchParams.search])

  const handleSubmitTodo = (data: CreateTodoInput | UpdateTodoInput) => {
    if (editingTodo) {
      updateMutation.mutate({ ...data, id: editingTodo.id })
    } else {
      createMutation.mutate(data as CreateTodoInput)
    }
  }

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }

  const handleDeleteTodo = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleToggleTodo = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    toggleMutation.mutate({ id, status: newStatus })
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingTodo(null)
    setError(null)
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }

  const handleAddCategory = (name: string, color: string) => {
    addCategoryMutation.mutate({ name, color, icon: 'tag' })
  }

  const handleCategorySelect = (categoryId: number | null) => {
    const params = new URLSearchParams(window.location.search)
    if (categoryId === null) {
      params.delete('categoryId')
    } else {
      params.set('categoryId', String(categoryId))
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString() || ''}`)
  }

  const handlePriorityChange = (priority: string) => {
    const params = new URLSearchParams(window.location.search)
    if (priority === 'all') {
      params.delete('priority')
    } else {
      params.set('priority', priority)
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString() || ''}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Todo App</h1>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Todo
            </Button>
          </div>
        </div>
      </header>

      <CategoryNav
        categories={localCategories}
        selectedCategoryId={searchParams.categoryId ?? null}
        onAddCategory={handleAddCategory}
        onCategorySelect={handleCategorySelect}
      />

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline">Dismiss</button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <SearchBar value={localSearch} onChange={setLocalSearch} />
          <FilterBar
            priorityFilter={searchParams.priority ?? 'all'}
            onPriorityChange={handlePriorityChange}
          />
        </div>

        {todosQuery.isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading todos...
          </div>
        ) : todosQuery.error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">Error connecting to database</p>
            <p className="text-gray-400 text-sm mb-4">{String(todosQuery.error)}</p>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : todosQuery.data?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No todos found</p>
            <p className="text-gray-400 text-sm mt-2">
              {localSearch || searchParams.categoryId || (searchParams.priority && searchParams.priority !== 'all')
                ? 'Try adjusting your filters'
                : 'Click "Add Todo" to create your first task'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todosQuery.data?.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                categories={localCategories}
                onToggle={(id) => handleToggleTodo(id, todo.status)}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
              />
            ))}
          </div>
        )}
      </main>

      <TodoForm
        todo={editingTodo || undefined}
        categories={localCategories}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTodo}
      />
    </div>
  )
}