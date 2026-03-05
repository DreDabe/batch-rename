import { useState, useCallback, useRef, useEffect } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  width: number
  onWidthChange: (width: number) => void
  side?: 'left' | 'right'
  className?: string
}

export function ResizablePanel({
  children,
  minWidth = 150,
  maxWidth = 400,
  width,
  onWidthChange,
  side = 'left',
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
    
    let newWidth: number
    if (side === 'left') {
      newWidth = e.clientX - rect.left
    } else {
      newWidth = rect.right - e.clientX
    }

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    onWidthChange(clampedWidth)
  }, [isResizing, minWidth, maxWidth, onWidthChange, side])

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
      className={`relative flex ${className}`}
      style={{ width: `${width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` }}
    >
      {children}
      
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10 ${
          isResizing 
            ? 'bg-blue-400' 
            : 'bg-transparent hover:bg-blue-200'
        }`}
        style={side === 'left' ? { right: 0 } : { left: 0 }}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
