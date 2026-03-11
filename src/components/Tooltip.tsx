import { useState, useRef, useEffect, useCallback } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  delay?: number
}

export function Tooltip({ content, children, delay = 1000 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0, arrowX: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const targetRect = (e.target as HTMLElement).getBoundingClientRect()
    
    timeoutRef.current = setTimeout(() => {
      if (!tooltipRef.current) return
      
      const tooltipWidth = tooltipRef.current.offsetWidth || 200
      const tooltipHeight = tooltipRef.current.offsetHeight || 40
      
      let x = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      let y = targetRect.top - tooltipHeight - 8
      
      if (x < 8) x = 8
      if (x + tooltipWidth > window.innerWidth - 8) {
        x = window.innerWidth - tooltipWidth - 8
      }
      
      if (y < 8) {
        y = targetRect.bottom + 8
      }
      
      const arrowX = targetRect.left + targetRect.width / 2 - x
      
      setPosition({ x, y, arrowX })
      setIsVisible(true)
    }, delay)
  }, [delay])

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!content) {
    return <>{children}</>
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg max-w-xs break-all border border-gray-700"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
          <div
            className="absolute w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-gray-700"
            style={{
              left: Math.max(8, Math.min(position.arrowX - 4, (tooltipRef.current?.offsetWidth || 200) - 12)),
              bottom: -5,
            }}
          />
        </div>
      )}
    </div>
  )
}
