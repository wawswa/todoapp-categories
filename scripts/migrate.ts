import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set')
  process.exit(1)
}

async function migrate() {
  console.log('Running migrations...')

  const sql = neon(connectionString)

  console.log('Creating tables...')
  await sql`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`

  await sql`CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`

  await sql`CREATE TABLE IF NOT EXISTS todo_categories (
    todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (todo_id, category_id)
  )`

  await sql`CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)`
  await sql`CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)`
  await sql`CREATE INDEX IF NOT EXISTS idx_todo_categories_todo ON todo_categories(todo_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_todo_categories_category ON todo_categories(category_id)`

  console.log('Tables created!')

  console.log('Clearing existing seed data...')
  await sql`TRUNCATE TABLE todo_categories, todos, categories RESTART IDENTITY CASCADE`

  console.log('Seeding categories...')
  await sql`INSERT INTO categories (name, color, icon) VALUES
    ('Work', '#EF4444', 'briefcase'),
    ('Personal', '#3B82F6', 'user'),
    ('Shopping', '#10B981', 'shopping-cart'),
    ('Health', '#F59E0B', 'heart'),
    ('Learning', '#8B5CF6', 'book')`

  console.log('Seeding todos...')
  await sql`INSERT INTO todos (title, description, due_date, priority, status) VALUES
    ('Complete project proposal', 'Draft the Q4 proposal for the new client', '2026-05-15', 'high', 'pending'),
    ('Buy groceries', 'Milk, bread, eggs, vegetables', '2026-05-13', 'medium', 'pending'),
    ('Morning jog', 'Run for 30 minutes around the park', '2026-05-12', 'low', 'pending'),
    ('Read React docs', 'Study the new React 19 features', '2026-05-20', 'medium', 'pending'),
    ('Call mom', 'Weekly catch-up call', '2026-05-14', 'medium', 'pending'),
    ('Finish coding assignment', 'Complete the TypeScript refactor', '2026-05-16', 'high', 'pending'),
    ('Yoga session', '30-minute morning yoga routine', '2026-05-12', 'low', 'completed'),
    ('Buy new headphones', 'Research and purchase wireless headphones', '2026-05-18', 'low', 'pending')`

  console.log('Linking todos to categories...')
  await sql`INSERT INTO todo_categories (todo_id, category_id) VALUES (1, 1), (2, 3), (3, 4), (4, 5), (5, 2), (6, 1), (7, 4), (8, 3)`

  console.log('Migration complete!')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
