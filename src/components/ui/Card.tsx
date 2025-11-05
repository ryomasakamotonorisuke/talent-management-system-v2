import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  style?: React.CSSProperties
}

export default function Card({ children, className = '', hover = false, glow = false, style }: CardProps) {
  const baseStyles = 'bg-white rounded-xl border border-primary-200 shadow-sm'
  const hoverStyles = hover ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''
  const glowStyles = glow ? 'card-glow' : ''
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${glowStyles} ${className} animate-fade-in-up`} style={style}>
      {children}
    </div>
  )
}

