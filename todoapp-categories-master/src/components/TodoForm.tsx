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
import { AlertCircle } from 'lucide-react'
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
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})
  const [showReminder, setShowReminder] = useState(false)

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description ?? '')
      if (todo.due_date) {
        const date = new Date(todo.due_date)
        setDueDate(date.toISOString().split('T')[0])
        setDueTime(date.toTimeString().substring(0, 5))
      } else {
        setDueDate('')
        setDueTime('')
      }
      setPriority(todo.priority)
      setSelectedCategories(todo.categories.map((c) => c.id))
      setShowReminder(!!todo.due_date)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setDueTime('')
      setPriority('medium')
      setSelectedCategories([])
      setShowReminder(false)
    }
    setErrors({})
  }, [todo, isOpen])

  const validateForm = () => {
    const newErrors: typeof errors = {}
    
    if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }
    
    if (description.trim().length > 0 && description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters or empty'
    }
    
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    let dueDatetime: string | undefined = undefined
    if (dueDate) {
      const dateTimeStr = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`
      dueDatetime = new Date(dateTimeStr).toISOString()
    }

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDatetime,
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
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors({...errors, title: undefined})
              }}
              placeholder="What needs to be done?"
              required
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors({...errors, description: undefined})
              }}
              placeholder="Add details..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  if (e.target.value) setShowReminder(true)
                }}
              />
            </div>

            {dueDate && (
              <div className="space-y-2">
                <Label htmlFor="dueTime">Due Time</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {showReminder && dueDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              📅 You have set a reminder for this task on {new Date(dueDate).toLocaleDateString()}
              {dueTime && ` at ${dueTime}`}
            </div>
          )}

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
