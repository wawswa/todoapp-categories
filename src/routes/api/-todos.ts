import { neon } from '@neondatabase/serverless'
import { createServerFn } from '@tanstack/react-start'
import type {
  Category,
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
} from '#/lib/types'

function getSql() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not set')
  return neon(dbUrl)
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

    if (!body.name.trim()) throw new Error('Category name is required')

    const result = await sql`
      INSERT INTO categories (name, color, icon) 
      VALUES (${body.name.trim()}, ${body.color || '#3B82F6'}, ${body.icon || 'tag'}) 
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

    if (!body.title.trim()) throw new Error('Title is required')

    const result = await sql`
      INSERT INTO todos (title, description, due_date, priority)
      VALUES (${body.title.trim()}, ${body.description || null}, ${body.due_date || null}, ${body.priority})
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
