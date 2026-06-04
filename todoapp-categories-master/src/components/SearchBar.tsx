import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search todos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-64"
      />
    </div>
  )
}
