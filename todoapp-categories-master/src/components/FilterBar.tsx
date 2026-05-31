import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Priority, PRIORITY_LABELS } from '#/lib/types'

interface FilterBarProps {
  priorityFilter: Priority | 'all'
  onPriorityChange: (value: Priority | 'all') => void
}

export function FilterBar({
  priorityFilter,
  onPriorityChange,
}: FilterBarProps) {
  return (
    <Select
      value={priorityFilter}
      onValueChange={(value) => onPriorityChange(value as Priority | 'all')}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Filter by priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Priorities</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
  )
}
