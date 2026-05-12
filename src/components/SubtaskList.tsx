import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Checkbox } from "#/components/ui/checkbox"
import { Input } from "#/components/ui/input"
import { Button } from "#/components/ui/button"
import { Progress } from "#/components/ui/progress"
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react"
import { cn } from "#/lib/utils"
import {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "#/routes/api/-todos"
import type { Subtask } from "#/lib/types"

// ─── Props ────────────────────────────────────────────────────────────────────

interface SubtaskListProps {
  todoId: number
  /** Jika true: hanya tampil, tanpa bisa edit/tambah/hapus */
  readonly?: boolean
  className?: string
}

// ─── SubtaskList (connected to backend) ──────────────────────────────────────

export function SubtaskList({ todoId, readonly = false, className }: SubtaskListProps) {
  const queryClient = useQueryClient()
  const [newTitle, setNewTitle] = useState("")

  // Fetch subtasks dari DB
  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ["subtasks", todoId],
    queryFn: () => getSubtasks({ data: { todo_id: todoId } }),
    staleTime: 30_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["subtasks", todoId] })
    // Juga refresh todo list supaya progress badge ikut update
    queryClient.invalidateQueries({ queryKey: ["todos"] })
  }

  // Mutations
  const addMutation = useMutation({
    mutationFn: (title: string) =>
      createSubtask({ data: { todo_id: todoId, title } }),
    onSuccess: () => {
      invalidate()
      setNewTitle("")
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (subtask: Subtask) =>
      updateSubtask({ data: { id: subtask.id, completed: !subtask.completed } }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSubtask({ data: { id } }),
    onSuccess: invalidate,
  })

  // Computed
  const completedCount = subtasks.filter((s) => s.completed).length
  const total = subtasks.length
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

  function handleAdd() {
    const trimmed = newTitle.trim()
    if (!trimmed || addMutation.isPending) return
    addMutation.mutate(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd()
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground py-1", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Memuat subtasks...
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header + progress */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Subtasks</span>
            <span>
              {completedCount}/{total} selesai
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Subtask items */}
      {subtasks.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
            >
              {!readonly && (
                <GripVertical
                  className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab"
                  aria-hidden
                />
              )}
              <Checkbox
                id={`subtask-${subtask.id}`}
                checked={subtask.completed}
                onCheckedChange={() => !readonly && toggleMutation.mutate(subtask)}
                disabled={readonly || toggleMutation.isPending}
                className="shrink-0"
              />
              <label
                htmlFor={`subtask-${subtask.id}`}
                className={cn(
                  "flex-1 text-sm cursor-pointer select-none",
                  subtask.completed && "line-through text-muted-foreground",
                )}
              >
                {subtask.title}
              </label>
              {!readonly && (
                <button
                  onClick={() => deleteMutation.mutate(subtask.id)}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-destructive disabled:opacity-30"
                  aria-label="Hapus subtask"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Input tambah subtask */}
      {!readonly && (
        <div className="flex items-center gap-2 mt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tambah subtask..."
            className="h-8 text-sm"
            disabled={addMutation.isPending}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={!newTitle.trim() || addMutation.isPending}
            className="h-8 px-2 shrink-0"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && readonly && (
        <p className="text-xs text-muted-foreground italic">Tidak ada subtask.</p>
      )}
    </div>
  )
}

// ─── SubtaskBadge: mini badge untuk TodoItem list ────────────────────────────

interface SubtaskBadgeProps {
  subtasks: Subtask[]
  className?: string
}

export function SubtaskBadge({ subtasks, className }: SubtaskBadgeProps) {
  if (subtasks.length === 0) return null
  const done = subtasks.filter((s) => s.completed).length
  const allDone = done === subtasks.length

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border",
        allDone
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {done}/{subtasks.length}
    </span>
  )
}