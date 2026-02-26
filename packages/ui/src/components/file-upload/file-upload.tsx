'use client'
import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FileUploadProps {
  accept?: string
  maxFiles?: number
  maxSizeMB?: number
  onFilesChange?: (files: File[]) => void
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  accept,
  maxFiles = 5,
  maxSizeMB = 10,
  onFilesChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase())
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const matchesType = acceptedTypes.some(
          (t) => t === ext || t === file.type || (t.endsWith('/*') && file.type.startsWith(t.replace('/*', '/')))
        )
        if (!matchesType) return `"${file.name}" is not an accepted file type`
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `"${file.name}" exceeds ${maxSizeMB}MB limit`
      }
      return null
    },
    [accept, maxSizeMB]
  )

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null)
      const fileArray = Array.from(newFiles)

      for (const file of fileArray) {
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          return
        }
      }

      const updated = [...files, ...fileArray].slice(0, maxFiles)
      if (files.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
      }
      setFiles(updated)
      onFilesChange?.(updated)
    },
    [files, maxFiles, validateFile, onFilesChange]
  )

  const removeFile = useCallback(
    (index: number) => {
      setError(null)
      const updated = files.filter((_, i) => i !== index)
      setFiles(updated)
      onFilesChange?.(updated)
    },
    [files, onFilesChange]
  )

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
        e.target.value = ''
      }
    },
    [addFiles]
  )

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-card p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-border hover:border-brand-primary hover:bg-hover/50'
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-text-caption mb-2" />
        <p className="text-sm font-body text-text-body">
          Drag files here or click to browse
        </p>
        {accept && (
          <p className="text-xs font-body text-text-caption mt-1">
            Accepts: {accept}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload files"
        />
      </div>

      {error && (
        <p className="text-status-urgent text-xs mt-1 font-body">{error}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-inner border border-border bg-bg-card px-3 py-2"
            >
              <FileText className="h-4 w-4 text-text-caption shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-text-body truncate">{file.name}</p>
                <p className="text-xs font-body text-text-caption">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="shrink-0 rounded-full p-1 hover:bg-hover transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4 text-text-caption" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
