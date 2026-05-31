// Raw SQL data layer using node-postgres (pg) - ESM-safe, works with Neon
import { Pool } from 'pg'

const rawUrl = process.env.DATABASE_URL
if (!rawUrl) throw new Error('DATABASE_URL must be set')

const url = new URL(rawUrl)
url.searchParams.delete('channel_binding')
const connectionString = url.toString()

const pool = new Pool({ connectionString })

export interface Category {
  id: string
  name: string
  color: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  _count?: { todos: number }
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: Date | null
  categoryId: string
  createdAt: Date
  updatedAt: Date
  category?: Category
}

// ─── Helpers ──────────────────────────────────────────────

function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _count: { todos: row.todo_count ? parseInt(row.todo_count, 10) : 0 },
  }
}

function rowToTodo(row: any): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    priority: row.priority,
    dueDate: row.due_date,
    categoryId: row.category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.cat_id
      ? {
          id: row.cat_id,
          name: row.cat_name,
          color: row.cat_color,
          isDefault: row.cat_is_default,
          createdAt: row.cat_created_at,
          updatedAt: row.cat_updated_at,
        }
      : undefined,
  }
}

// ─── Categories ──────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const result = await pool.query(
    `SELECT c.*, COUNT(t.id)::text AS todo_count
     FROM categories c
     LEFT JOIN todos t ON t.category_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at ASC`
  )
  return result.rows.map(rowToCategory)
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const result = await pool.query(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  )
  return result.rows[0] ? rowToCategory(result.rows[0]) : null
}

export async function createCategory(name: string, color?: string): Promise<Category> {
  const result = await pool.query(
    `INSERT INTO categories (name, color, is_default) VALUES ($1, $2, $3) RETURNING *`,
    [name, color || null, false]
  )
  return rowToCategory(result.rows[0])
}

export async function updateCategory(id: string, name: string, color?: string): Promise<Category | null> {
  const result = await pool.query(
    `UPDATE categories SET name = $1, color = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, color || null, id]
  )
  return result.rows[0] ? rowToCategory(result.rows[0]) : null
}

export async function deleteCategory(id: string): Promise<Category | null> {
  // First move all todos to the default "Uncategorized" category
  const uncategorized = await pool.query(
    `SELECT id FROM categories WHERE is_default = true LIMIT 1`
  )
  if (!uncategorized.rows[0]) {
    throw new Error('Default Uncategorized category not found')
  }
  const defaultId = uncategorized.rows[0].id

  await pool.query(
    `UPDATE todos SET category_id = $1, updated_at = NOW() WHERE category_id = $2`,
    [defaultId, id]
  )

  const result = await pool.query(
    `DELETE FROM categories WHERE id = $1 RETURNING *`,
    [id]
  )
  return result.rows[0] ? rowToCategory(result.rows[0]) : null
}

// ─── Todos ────────────────────────────────────────────────

export interface TodoFilters {
  search?: string
  categoryId?: string
  completed?: string
  priority?: string
  sortBy?: string
}

export async function getTodos(filters: TodoFilters = {}): Promise<Todo[]> {
  const conditions: string[] = ['1=1']
  const params: any[] = []
  let paramIndex = 1

  if (filters.search) {
    conditions.push(`t.title ILIKE $${paramIndex}`)
    params.push(`%${filters.search}%`)
    paramIndex++
  }
  if (filters.categoryId && filters.categoryId !== 'all') {
    conditions.push(`t.category_id = $${paramIndex}`)
    params.push(filters.categoryId)
    paramIndex++
  }
  if (filters.completed && filters.completed !== 'all') {
    conditions.push(`t.completed = $${paramIndex}`)
    params.push(filters.completed === 'completed')
    paramIndex++
  }
  if (filters.priority && filters.priority !== 'all') {
    conditions.push(`t.priority = $${paramIndex}`)
    params.push(filters.priority)
    paramIndex++
  }

  const sortMap: Record<string, string> = {
    dueDate: 't.due_date ASC NULLS LAST',
    createdAt: 't.created_at DESC',
    priority: `CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END`,
  }
  const orderBy = sortMap[filters.sortBy || 'dueDate'] || sortMap.dueDate

  const query = `
    SELECT t.*,
      c.id AS cat_id, c.name AS cat_name, c.color AS cat_color,
      c.is_default AS cat_is_default, c.created_at AS cat_created_at, c.updated_at AS cat_updated_at
    FROM todos t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
  `

  const result = await pool.query(query, params)
  return result.rows.map(rowToTodo)
}

export async function createTodo(data: {
  title: string
  categoryId: string
  priority: string
  dueDate?: Date | string | null
}): Promise<Todo> {
  const dueDate = data.dueDate ? (typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate) : null
  const result = await pool.query(
    `INSERT INTO todos (title, category_id, priority, due_date) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.title, data.categoryId, data.priority, dueDate]
  )
  return rowToTodo(result.rows[0])
}

export async function updateTodo(id: string, data: Partial<{
  title: string
  categoryId: string
  priority: string
  dueDate: Date | string | null
  completed: boolean
}>): Promise<Todo | null> {
  const fields: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex}`)
    params.push(data.title)
    paramIndex++
  }
  if (data.categoryId !== undefined) {
    fields.push(`category_id = $${paramIndex}`)
    params.push(data.categoryId)
    paramIndex++
  }
  if (data.priority !== undefined) {
    fields.push(`priority = $${paramIndex}`)
    params.push(data.priority)
    paramIndex++
  }
  if (data.completed !== undefined) {
    fields.push(`completed = $${paramIndex}`)
    params.push(data.completed)
    paramIndex++
  }
  if (data.dueDate !== undefined) {
    const dueDate = data.dueDate ? (typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate) : null
    fields.push(`due_date = $${paramIndex}`)
    params.push(dueDate)
    paramIndex++
  }

  if (fields.length === 0) return null

  fields.push(`updated_at = NOW()`)

  const query = `UPDATE todos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
  params.push(id)

  const result = await pool.query(query, params)
  return result.rows[0] ? rowToTodo(result.rows[0]) : null
}

export async function toggleTodoCompletion(id: string): Promise<Todo | null> {
  const result = await pool.query(
    `UPDATE todos SET completed = NOT completed, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  )
  return result.rows[0] ? rowToTodo(result.rows[0]) : null
}

export async function deleteTodo(id: string): Promise<void> {
  await pool.query(`DELETE FROM todos WHERE id = $1`, [id])
}
