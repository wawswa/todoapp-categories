import { useState } from 'react'
import type { Category } from '#/lib/types'
import {
  Briefcase,
  User,
  ShoppingCart,
  Heart,
  Book,
  LayoutList,
  Plus,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  user: User,
  'shopping-cart': ShoppingCart,
  heart: Heart,
  book: Book,
  tag: LayoutList,
}

interface CategoryNavProps {
  categories: Category[]
  selectedCategoryId: number | null
  onAddCategory?: (name: string, color: string) => void
  onCategorySelect?: (categoryId: number | null) => void
}

export function CategoryNav({
  categories,
  selectedCategoryId,
  onAddCategory,
  onCategorySelect,
}: CategoryNavProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')

  const handleAddCategory = () => {
    if (newCategoryName.trim() && onAddCategory) {
      onAddCategory(newCategoryName.trim(), newCategoryColor)
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      setIsAdding(false)
    }
  }

  const handleCategoryClick = (categoryId: number | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId)
    }
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <ul className="flex items-center gap-1 -mb-px overflow-x-auto">
          <li>
            <button
              onClick={() => handleCategoryClick(null)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedCategoryId === null
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              All
            </button>
          </li>
          {categories.map((category) => {
            const IconComponent = category.icon ? iconMap[category.icon] : null
            const isSelected = selectedCategoryId === category.id
            return (
              <li key={category.id}>
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'border-transparent'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: isSelected ? category.color : undefined,
                    color: isSelected ? category.color : undefined,
                  }}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  {category.name}
                </button>
              </li>
            )
          })}
          {onAddCategory && (
            <li>
              {isAdding ? (
                <div className="flex items-center gap-2 px-2 py-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory()
                      if (e.key === 'Escape') setIsAdding(false)
                    }}
                  />
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
