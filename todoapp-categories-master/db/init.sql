-- Clear existing seed data (for re-running)
DELETE FROM todo_categories;
DELETE FROM todos;
DELETE FROM categories;
DELETE FROM categories;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE todos_id_seq RESTART WITH 1;

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
    (1, 1),
    (2, 3),
    (3, 4),
    (4, 5),
    (5, 2),
    (6, 1),
    (7, 4),
    (8, 3);