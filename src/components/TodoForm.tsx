import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Label } from '#/components/ui/label'
import type {
  Todo,
  Category,
  CreateTodoInput,
  UpdateTodoInput,
  Priority,
} from '#/lib/types'

interface TodoFormProps {
  todo?: Todo
  categories: Category[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => void
}

export function TodoForm({
  todo,
  categories,
  isOpen,
  onClose,
  onSubmit,
}: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description ?? '')
      setDueDate(
        todo.due_date
          ? new Date(todo.due_date).toISOString().split('T')[0]
          : '',
      )
      setPriority(todo.priority)
      setSelectedCategories(todo.categories.map((c) => c.id))
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      setSelectedCategories([])
    }
  }, [todo, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      priority,
      category_ids: selectedCategories.length > 0 ? selectedCategories : [],
    }

    onSubmit(data)
    onClose()
  }

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? 'Edit Todo' : 'Add New Todo'}</DialogTitle>
          <DialogDescription>
            {todo
              ? 'Update the details of your todo.'
              : 'Create a new todo item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategories.includes(category.id)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: selectedCategories.includes(category.id)
                        ? category.color
                        : undefined,
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{todo ? 'Save Changes' : 'Add Todo'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
