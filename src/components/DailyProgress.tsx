import { useMemo } from "react"
import { Progress } from "#/components/ui/progress"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "#/lib/utils"
import type { Todo } from "#/lib/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getMotivationMessage(percent: number, total: number): string {
  if (total === 0) return "Tidak ada task hari ini. Santai dulu! ☕"
  if (percent === 0) return "Yuk mulai dari yang termudah!"
  if (percent < 30) return "Awal yang bagus, tetap semangat!"
  if (percent < 60) return "Mantap, sudah separuh jalan!"
  if (percent < 100) return "Hampir selesai, push terakhir!"
  return "Semua task hari ini selesai! 🎉"
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DailyProgressProps {
  /**
   * Todos yang sudah di-fetch dari backend (pakai type Todo dari types.ts).
   * Komponen akan filter sendiri yang due-date-nya hari ini.
   */
  todos: Todo[]
  /** Tanggal referensi, default: hari ini */
  date?: Date
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyProgress({ todos, date, className }: DailyProgressProps) {
  const today = date ?? new Date()

  // Filter todos yang due hari ini ATAU yang belum selesai tanpa due date
  const todayTodos = useMemo(
    () =>
      todos.filter((t) => {
        if (t.due_date) {
          return isSameDay(new Date(t.due_date), today)
        }
        // Todos tanpa due date yang masih pending → masuk hitungan hari ini
        return t.status === "pending"
      }),
    [todos, today],
  )

  // Mapping: "completed" = done, "pending" = belum
  const done = todayTodos.filter((t) => t.status === "completed").length
  const pending = todayTodos.filter((t) => t.status === "pending").length
  const total = todayTodos.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const motivation = getMotivationMessage(percent, total)

  // Warna progress bar
  const progressColor =
    percent === 100
      ? "bg-green-500"
      : percent >= 60
        ? "bg-blue-500"
        : percent >= 30
          ? "bg-amber-500"
          : "bg-rose-400"

  if (total === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground text-center",
          className,
        )}
      >
        {motivation}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-4 py-3 flex flex-col gap-2",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium leading-none">Progress hari ini</p>
          <p className="text-xs text-muted-foreground mt-0.5">{motivation}</p>
        </div>
        <span
          className={cn(
            "text-2xl font-semibold tabular-nums",
            percent === 100 ? "text-green-600" : "text-foreground",
          )}
        >
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            progressColor,
          )}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${done} dari ${total} task selesai`}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <strong className="text-foreground">{done}</strong> selesai
        </span>
        <span className="flex items-center gap-1">
          <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
          <strong className="text-foreground">{pending}</strong> belum mulai
        </span>
      </div>
    </div>
  )
}

// ─── Hook helper ─────────────────────────────────────────────────────────────

export function useDailyProgressStats(todos: Todo[], date?: Date) {
  const today = date ?? new Date()

  return useMemo(() => {
    const todayTodos = todos.filter((t) => {
      if (t.due_date) return isSameDay(new Date(t.due_date), today)
      return t.status === "pending"
    })

    const done = todayTodos.filter((t) => t.status === "completed").length
    const total = todayTodos.length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0

    return { done, total, percent, todayTodos }
  }, [todos, today])
}