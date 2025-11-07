'use client'

import React from 'react'

export type InputType = 'youtube' | 'blog' | 'memo'

interface InputTypeSelectorProps {
  value: InputType
  onChange: (value: InputType) => void
  className?: string
}

export function InputTypeSelector({ value, onChange, className = '' }: InputTypeSelectorProps) {
  const options: Array<{ value: InputType; label: string; icon: string }> = [
    { value: 'youtube', label: 'YouTube Video', icon: '🎥' },
    { value: 'blog', label: 'Blog Post', icon: '📝' },
    { value: 'memo', label: 'Memo', icon: '📄' },
  ]

  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            flex-1 px-4 py-3 rounded-lg border-2 transition-all
            ${
              value === option.value
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">{option.icon}</span>
            <span className="text-sm font-medium">{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

