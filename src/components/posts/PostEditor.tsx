'use client'

import React, { useState, useRef } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

interface PostEditorProps {
  content: any // Lexical RichText content
  onChange: (content: any) => void
  className?: string
  readOnly?: boolean
}

/**
 * PostEditor Component
 * 
 * Note: For now, this is a read-only display component using RichText from @payloadcms/richtext-lexical/react.
 * Full editing capabilities with Lexical editor will be implemented in a future iteration.
 * 
 * For editing, we'll need to integrate the Lexical editor with proper toolbar and formatting options.
 */
export function PostEditor({
  content,
  onChange,
  className = '',
  readOnly = false,
}: PostEditorProps) {
  // For now, we display the content read-only
  // Full editor implementation will require Lexical editor setup with toolbar
  if (readOnly || !onChange) {
    return (
      <div className={`prose max-w-none dark:prose-invert ${className}`}>
        <RichText data={content} />
      </div>
    )
  }

  // TODO: Implement full Lexical editor with toolbar for editing
  // This requires:
  // 1. Setting up Lexical editor with proper configuration
  // 2. Adding toolbar with formatting options (bold, italic, lists, links)
  // 3. Handling content changes and syncing with parent component
  
  // For now, show a placeholder message
  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg p-4 ${className}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        RichText-Editor wird geladen... Vollständige Bearbeitungsfunktionen werden in einer zukünftigen Version verfügbar sein.
      </p>
      <div className="mt-4 prose max-w-none dark:prose-invert">
        <RichText data={content} />
      </div>
    </div>
  )
}

