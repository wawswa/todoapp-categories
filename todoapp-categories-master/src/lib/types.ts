export type Priority = 'low' | 'medium' | 'high'
export type TodoStatus = 'pending' | 'completed'

export interface Category {
  id: number
  name: string
  color: string
  icon: string | null
  created_at: Date
}

export interface Todo {
  id: number
  title: string
  description: string | null
  due_date: Date | null
  priority: Priority
  status: TodoStatus
  created_at: Date
  updated_at: Date
  categories: Category[]
}

export interface CreateTodoInput {
  title: string
  description?: string
  due_date?: string
  priority: Priority
  category_ids?: number[]
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  due_date?: string | null
  priority?: Priority
  status?: TodoStatus
  category_ids?: number[]
}

export interface CreateCategoryInput {
  name: string
  color?: string
  icon?: string
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
