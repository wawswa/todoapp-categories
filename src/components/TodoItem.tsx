import type { Todo, Category } from '#/lib/types'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '#/lib/types'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Calendar, Trash2, Edit2, Tag } from 'lucide-react'

interface TodoItemProps {
  todo: Todo
  categories: Category[]
  onToggle: (id: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => void
}

export function TodoItem({
  todo,
  categories,
  onToggle,
  onEdit,
  onDelete,
}: TodoItemProps) {
  const isOverdue =
    todo.due_date &&
    new Date(todo.due_date) < new Date() &&
    todo.status === 'pending'
  const formattedDate = todo.due_date
    ? new Date(todo.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  const handleEdit = () => onEdit(todo)

  const handleDelete = () => {
    console.log(
      '[TodoItem] handleDelete todo.id:',
      todo.id,
      'typeof:',
      typeof todo.id,
    )
    onDelete(todo.id)
  }

  return (
    <Card
      className={`p-4 transition-all ${todo.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 cursor-pointer p-0.5 rounded hover:bg-gray-100 transition-colors"
          onClick={() => onToggle(todo.id)}
          role="checkbox"
          aria-checked={todo.status === 'completed'}
        >
          <Checkbox checked={todo.status === 'completed'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium ${todo.status === 'completed' ? 'line-through text-gray-500' : ''}`}
            >
              {todo.title}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[todo.priority]}`}
            >
              {PRIORITY_LABELS[todo.priority]}
            </span>
          </div>

          {todo.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {formattedDate && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formattedDate}
                {isOverdue && ' (overdue)'}
              </span>
            )}

            {todo.categories.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Tag className="w-3 h-3" />
                {todo.categories.map((c) => (
                  <span
                    key={c.id}
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{ backgroundColor: c.color + '20', color: c.color }}
                  >
                    {c.name}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
