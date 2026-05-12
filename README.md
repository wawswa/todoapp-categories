# Todo App with Categories

A full-stack todo application built with TanStack Start, Neon Postgres, Tailwind CSS, and Shadcn UI.

## Features

- **Categories** - Organize todos by category (Work, Personal, Shopping, etc.)
- **Priority** - Filter todos by Low/Medium/High priority
- **Due Dates** - Set and track due dates for todos
- **Search** - Real-time search by todo title
- **CRUD Operations** - Create, read, update, delete todos
- **Custom Categories** - Add new categories from the navbar

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database (Neon Postgres)

If using a new Neon database:

```bash
# Add your DATABASE_URL to .env file first
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Run migrations and seed data
pnpm run migrate
```

### 3. Run Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Order of Operations

```bash
# 1. Install dependencies (first time only)
pnpm install

# 2. Make code changes

# 3. Lint and format code (before committing)
pnpm run lint
pnpm run format

# 4. Check for errors
pnpm run check

# 5. Build for production
pnpm run build

# 6. Test the application
pnpm run test

# 7. Run development server
pnpm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Start development server |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format code with Prettier |
| `pnpm run check` | Check code formatting |
| `pnpm run test` | Run tests with Vitest |
| `pnpm run migrate` | Run database migrations with Neon |

## Database Schema

The app uses three main tables:

- **categories** - Todo categories (id, name, color, icon)
- **todos** - Todo items (id, title, description, due_date, priority, status)
- **todo_categories** - Junction table for many-to-many relationship

### Reset Database

To reset and reseed the database:

```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/init.sql
```

Or simply:

```bash
pnpm run migrate
```

## DBML Schema for dbdiagram.io

Import `db/schema.dbml` to [dbdiagram.io](https://dbdiagram.io/d) to visualize the database schema.

## Tech Stack

- **Frontend**: React 19, TanStack Router, TanStack Query
- **Backend**: TanStack Start (Nitro)
- **Database**: Neon Postgres
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React

## Adding Components

```bash
# Add a new shadcn component
pnpm dlx shadcn@latest add button

# Then import it in your code
import { Button } from '#/components/ui/button'
```

## Learn More

- [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- [TanStack Router](https://tanstack.com/router) - Type-safe routing
- [Neon](https://neon.tech) - Serverless Postgres
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Shadcn](https://ui.shadcn.com) - UI component library