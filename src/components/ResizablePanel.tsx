import { useState, useCallback, useRef, useEffect } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  width: number
  onWidthChange: (width: number) => void
  className?: string
}

export function ResizablePanel({
  children,
  minWidth = 150,
  maxWidth = 400,
  width,
  onWidthChange,
  className = '',
}: ResizablePanelProps) {
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return

    const panel = panelRef.current
    const rect = panel.getBoundingClientRect()
    const newWidth = e.clientX - rect.left

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    onWidthChange(clampedWidth)
  }, [isResizing, minWidth, maxWidth, onWidthChange])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={panelRef}
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: `${width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` }}
    >
      <div className="h-full w-full overflow-hidden">
        {children}
      </div>
      
      <div
        className={`absolute top-0 bottom-0 right-0 w-1 cursor-col-resize transition-colors z-10 ${
          isResizing 
            ? 'bg-blue-400' 
            : 'bg-transparent hover:bg-blue-200'
        }`}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
