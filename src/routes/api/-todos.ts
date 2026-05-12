import { Pool } from 'pg'
import { createServerFn } from '@tanstack/react-start'
import type {
  Category,
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
} from '#/lib/types'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    let dbUrl = process.env.DATABASE_URL
    if (!dbUrl) throw new Error('DATABASE_URL not set')
    
    dbUrl = dbUrl.replace('channel_binding=require&', '').replace('&channel_binding=require', '').replace('channel_binding=require', '')
    
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 5,
    })
    
    pool.on('error', (err) => {
      console.error('Pool error:', err.message)
      pool = null
    })
  }
  return pool
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
    const client = await getPool().connect()
    try {
      const result = await client.query(
        'SELECT * FROM categories ORDER BY name ASC',
      )
      return result.rows as Category[]
    } finally {
      client.release()
    }
  },
)

export const createCategory = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const client = await getPool().connect()
    try {
      const body = data as { name: string; color: string; icon: string }
      
      if (!body.name.trim()) throw new Error('Category name is required')
      
      const result = await client.query(
        `INSERT INTO categories (name, color, icon) VALUES ($1, $2, $3) RETURNING *`,
        [body.name.trim(), body.color || '#3B82F6', body.icon || 'tag'],
      )
      
      return result.rows[0] as Category
    } finally {
      client.release()
    }
  },
)

export const getTodos = createServerFn({ method: 'GET' }).handler(
  async ({ data }) => {
    const client = await getPool().connect()
    try {
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

      const result = await client.query(query)

      return result.rows.map((row: any) => ({
        ...row,
        due_date: row.due_date ? new Date(row.due_date) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        categories: row.categories || [],
      })) as Todo[]
    } finally {
      client.release()
    }
  },
)

export const createTodo = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const client = await getPool().connect()
    try {
      const body = data as CreateTodoInput

      if (!body.title.trim()) throw new Error('Title is required')

      const result = await client.query(
        `INSERT INTO todos (title, description, due_date, priority)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [body.title.trim(), body.description || null, body.due_date || null, body.priority],
      )

      const todo = result.rows[0]

      if (body.category_ids && body.category_ids.length > 0) {
        for (const catId of body.category_ids) {
          await client.query(
            'INSERT INTO todo_categories (todo_id, category_id) VALUES ($1, $2)',
            [todo.id, catId],
          )
        }
      }

      const resultWithCategories = await client.query(
        `SELECT 
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
        GROUP BY t.id`,
        [todo.id],
      )

      const row = resultWithCategories.rows[0]
      return {
        ...row,
        due_date: row.due_date ? new Date(row.due_date) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        categories: row.categories || [],
      } as Todo
    } finally {
      client.release()
    }
  },
)

export const updateTodo = createServerFn({ method: 'PUT' }).handler(
  async ({ data }) => {
    const client = await getPool().connect()
    try {
      const body = data as UpdateTodoInput & { id: number }
      const id = body.id

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
        await client.query(
          `UPDATE todos SET ${updates.join(', ')} WHERE id = $${idx}`,
          values,
        )
      }

      if (body.category_ids !== undefined) {
        await client.query('DELETE FROM todo_categories WHERE todo_id = $1', [id])
        for (const catId of body.category_ids) {
          await client.query(
            'INSERT INTO todo_categories (todo_id, category_id) VALUES ($1, $2)',
            [id, catId],
          )
        }
      }

      const result = await client.query(
        `SELECT 
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
        GROUP BY t.id`,
        [id],
      )

      const row = result.rows[0]
      return {
        ...row,
        due_date: row.due_date ? new Date(row.due_date) : null,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        categories: row.categories || [],
      } as Todo
    } finally {
      client.release()
    }
  },
)

export const deleteTodo = createServerFn({ method: 'DELETE' }).handler(
  async ({ data }) => {
    const client = await getPool().connect()
    try {
      const id = data?.id ?? 0
      if (!id) throw new Error('Todo ID is required')
      await client.query('DELETE FROM todos WHERE id = $1', [id])
      return { success: true }
    } finally {
      client.release()
    }
  },
)

export const toggleTodoStatus = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const client = await getPool().connect()
    try {
      const id = data?.id ?? 0
      const status = data?.status ?? 'pending'

      if (!id) throw new Error('Todo ID is required')

      const result = await client.query(
        `UPDATE todos 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2
         RETURNING *`,
        [status, id],
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  },
)