-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Todos table with priority and due date
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS todo_categories (
    todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (todo_id, category_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);

-- Categories
INSERT INTO categories (name, color, icon) VALUES
    ('Work', '#EF4444', 'briefcase'),
    ('Personal', '#3B82F6', 'user'),
    ('Shopping', '#10B981', 'shopping-cart'),
    ('Health', '#F59E0B', 'heart'),
    ('Learning', '#8B5CF6', 'book');

-- Todos with various priorities and dates
INSERT INTO todos (title, description, due_date, priority, status) VALUES
    ('Complete project proposal', 'Draft the Q4 proposal for the new client', '2026-05-15', 'high', 'pending'),
    ('Buy groceries', 'Milk, bread, eggs, vegetables', '2026-05-13', 'medium', 'pending'),
    ('Morning jog', 'Run for 30 minutes around the park', '2026-05-12', 'low', 'pending'),
    ('Read React docs', 'Study the new React 19 features', '2026-05-20', 'medium', 'pending'),
    ('Call mom', 'Weekly catch-up call', '2026-05-14', 'medium', 'pending'),
    ('Finish coding assignment', 'Complete the TypeScript refactor', '2026-05-16', 'high', 'pending'),
    ('Yoga session', '30-minute morning yoga routine', '2026-05-12', 'low', 'completed'),
    ('Buy new headphones', 'Research and purchase wireless headphones', '2026-05-18', 'low', 'pending');

-- Link todos to categories
INSERT INTO todo_categories (todo_id, category_id) VALUES
    (1, 1), -- Complete project proposal -> Work
    (2, 3), -- Buy groceries -> Shopping
    (3, 4), -- Morning jog -> Health
    (4, 5), -- Read React docs -> Learning
    (5, 2), -- Call mom -> Personal
    (6, 1), -- Finish coding assignment -> Work
    (7, 4), -- Yoga session -> Health
    (8, 3); -- Buy new headphones -> Shopping