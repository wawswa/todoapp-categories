import { createServerFn } from '@tanstack/react-start'
import { sql } from '#/db'
import type {
  Category,
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
} from '#/lib/types'

function getSql() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not set')
  return sql(dbUrl)
}

function getParam(data: any, key: string): string | null {
  if (!data) return null
  if (typeof data.get === 'function') {
    return data.get(key)
  }
  return data[key] ?? null
}

export const getCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sql = getSql()
    const result = await sql`SELECT * FROM categories ORDER BY name ASC`
    return result as Category[]
  },
)

export const createCategory = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const sql = getSql()
    const body = data as { name: string; color: string; icon: string }

    const name = body.name.trim()
    if (!name) throw new Error('Category name is required')
    if (name.length < 2) throw new Error('Category name must be at least 2 characters')

    const result = await sql`
      INSERT INTO categories (name, color, icon) 
      VALUES (${name}, ${body.color || '#3B82F6'}, ${body.icon || 'tag'}) 
      RETURNING *
    `

    return result[0] as Category
  },
)

export const getTodos = createServerFn({ method: 'GET' }).handler(
  async ({ data }) => {
    const sql = getSql()
    const categoryId = getParam(data, 'categoryId')
    const priority = getParam(data, 'priority')
    const search = getParam(data, 'search')
    const status = getParam(data, 'status')

    let query = `
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'color', c.color,
              'icon', c.icon,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM todos t
      LEFT JOIN todo_categories tc ON t.id = tc.todo_id
      LEFT JOIN categories c ON tc.category_id = c.id
    `

    const conditions: string[] = []

    if (categoryId) {
      conditions.push(
        `EXISTS (SELECT 1 FROM todo_categories WHERE todo_id = t.id AND category_id = ${parseInt(categoryId)})`,
      )
    }

    if (priority && priority !== 'all') {
      conditions.push(`t.priority = '${priority}'`)
    }

    if (search) {
      const escaped = search.replace(/'/g, "''")
      conditions.push(`LOWER(t.title) LIKE '%${escaped.toLowerCase()}%'`)
    }

    if (status && status !== 'all') {
      conditions.push(`t.status = '${status}'`)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' GROUP BY t.id ORDER BY t.created_at DESC'

    const result = await sql.query(query)

    return result.map((row: any) => ({
      ...row,
      due_date: row.due_date ? new Date(row.due_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      categories: row.categories || [],
    })) as Todo[]
  },
)

export const createTodo = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const sql = getSql()
    const body = data as CreateTodoInput

    const title = body.title.trim()
    if (!title) throw new Error('Title is required')
    if (title.length < 3) throw new Error('Title must be at least 3 characters')

    if (body.description !== undefined && body.description.trim()) {
      const desc = body.description.trim()
      if (desc.length < 5) throw new Error('Description must be at least 5 characters or empty')
    }

    const result = await sql`
      INSERT INTO todos (title, description, due_date, priority)
      VALUES (${title}, ${body.description || null}, ${body.due_date || null}, ${body.priority})
      RETURNING *
    `

    const todo = result[0]

    if (body.category_ids && body.category_ids.length > 0) {
      for (const catId of body.category_ids) {
        await sql`INSERT INTO todo_categories (todo_id, category_id) VALUES (${todo.id}, ${catId})`
      }
    }

    const resultWithCategories = await sql`
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'color', c.color,
              'icon', c.icon,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM todos t
      LEFT JOIN todo_categories tc ON t.id = tc.todo_id
      LEFT JOIN categories c ON tc.category_id = c.id
      WHERE t.id = ${todo.id}
      GROUP BY t.id
    `

    const row = resultWithCategories[0]
    return {
      ...row,
      due_date: row.due_date ? new Date(row.due_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      categories: Array.isArray(row.categories) ? row.categories : [],
    } as Todo
  },
)

export const updateTodo = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    console.log('[updateTodo] Received data:', JSON.stringify(data))

    const sql = getSql()
    const body = data as UpdateTodoInput & { id: number }
    console.log('[updateTodo] body:', body)

    const id = body.id
    console.log('[updateTodo] id:', id, 'type:', typeof id)

    if (!id || typeof id !== 'number') {
      throw new Error(
        `Update failed: invalid id (received: ${JSON.stringify(data)})`,
      )
    }

    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (body.title !== undefined) {
      updates.push(`title = $${idx++}`)
      values.push(body.title.trim())
    }
    if (body.description !== undefined) {
      updates.push(`description = $${idx++}`)
      values.push(body.description || null)
    }
    if (body.due_date !== undefined) {
      updates.push(`due_date = $${idx++}`)
      values.push(body.due_date || null)
    }
    if (body.priority !== undefined) {
      updates.push(`priority = $${idx++}`)
      values.push(body.priority)
    }
    if (body.status !== undefined) {
      updates.push(`status = $${idx++}`)
      values.push(body.status)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    if (updates.length > 1) {
      await sql.query(
        `UPDATE todos SET ${updates.join(', ')} WHERE id = $${idx}`,
        values,
      )
    }

    if (body.category_ids !== undefined) {
      await sql.query('DELETE FROM todo_categories WHERE todo_id = $1', [id])
      for (const catId of body.category_ids) {
        await sql`INSERT INTO todo_categories (todo_id, category_id) VALUES (${id}, ${catId})`
      }
    }

    const result = await sql.query(
      `
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'color', c.color,
              'icon', c.icon,
              'created_at', c.created_at
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM todos t
      LEFT JOIN todo_categories tc ON t.id = tc.todo_id
      LEFT JOIN categories c ON tc.category_id = c.id
      WHERE t.id = $1
      GROUP BY t.id
    `,
      [id],
    )

    const row = result[0]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!row) throw new Error('Todo not found')
    return {
      ...row,
      due_date: row.due_date ? new Date(row.due_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      categories: Array.isArray(row.categories) ? row.categories : [],
    } as Todo
  },
)

export const deleteTodo = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    console.log('[deleteTodo] Received data:', JSON.stringify(data))

    const sql = getSql()
    const body = data as { id: number } | undefined
    console.log('[deleteTodo] body:', body)

    const id = body?.id
    console.log('[deleteTodo] id:', id, 'type:', typeof id)

    if (!id || typeof id !== 'number') {
      throw new Error(
        `Delete failed: invalid id (received: ${JSON.stringify(data)})`,
      )
    }

    await sql`DELETE FROM todos WHERE id = ${id}`
    return { success: true }
  },
)

export const toggleTodoStatus = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const sql = getSql()
    const id = data?.id ?? 0
    const status = data?.status ?? 'pending'

    if (!id) throw new Error('Todo ID is required')

    const result = await sql`
      UPDATE todos 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
      RETURNING *
    `

    if (!result[0]) throw new Error('Failed to toggle todo')
    return result[0]
  },
)

export const getTodoCountsByCategory = createServerFn({
  method: 'GET',
}).handler(async () => {
  const sql = getSql()

  const overall = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM todos
  `

  const byCategory = await sql`
    SELECT
      c.id as category_id,
      c.name as category_name,
      COUNT(tc.todo_id) as total,
      COUNT(*) FILTER (WHERE t.status = 'completed') as completed
    FROM categories c
    LEFT JOIN todo_categories tc ON c.id = tc.category_id
    LEFT JOIN todos t ON tc.todo_id = t.id
    GROUP BY c.id, c.name
    ORDER BY c.name ASC
  `

  return {
    overall: overall[0] as { total: number; completed: number },
    byCategory: byCategory as {
      category_id: number
      category_name: string
      total: number
      completed: number
    }[],
  }
})

export const deleteCategory = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const sql = getSql()
    const categoryId = (data as { id: number } | undefined)?.id

    if (!categoryId) throw new Error('Category ID is required')

    // Delete the category (will cascade delete todo_categories entries)
    await sql`DELETE FROM categories WHERE id = ${categoryId}`
    
    return { success: true }
  },
)
