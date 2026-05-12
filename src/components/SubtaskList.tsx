import { useState } from "react";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { Progress } from "#/components/ui/progress";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "#/lib/utils";


export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  /** Opsional: readonly mode (untuk list view, bukan detail panel) */
  readonly?: boolean;
}


function createSubtask(title: string): Subtask {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date(),
  };
}


export function SubtaskList({ subtasks, onChange, readonly = false }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");

  const completedCount = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  function toggleSubtask(id: string) {
    onChange(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  }

  function deleteSubtask(id: string) {
    onChange(subtasks.filter((s) => s.id !== id));
  }

  function addSubtask() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onChange([...subtasks, createSubtask(trimmed)]);
    setNewTitle("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addSubtask();
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header + progress */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Subtasks</span>
            <span>{completedCount}/{total} selesai</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Subtask items */}
      <ul className="flex flex-col gap-1">
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
              onCheckedChange={() => toggleSubtask(subtask.id)}
              disabled={readonly}
              className="shrink-0"
            />
            <label
              htmlFor={`subtask-${subtask.id}`}
              className={cn(
                "flex-1 text-sm cursor-pointer select-none",
                subtask.completed && "line-through text-muted-foreground"
              )}
            >
              {subtask.title}
            </label>
            {!readonly && (
              <button
                onClick={() => deleteSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-destructive"
                aria-label="Hapus subtask"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Input tambah subtask */}
      {!readonly && (
        <div className="flex items-center gap-2 mt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tambah subtask..."
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addSubtask}
            disabled={!newTitle.trim()}
            className="h-8 px-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface SubtaskBadgeProps {
  subtasks: Subtask[];
  className?: string;
}

export function SubtaskBadge({ subtasks, className }: SubtaskBadgeProps) {
  if (subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.completed).length;
  const allDone = done === subtasks.length;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border",
        allDone
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-muted text-muted-foreground border-border",
        className
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
  );
}