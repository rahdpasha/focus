import type { LucideIcon } from 'lucide-react'
import { useRef, useEffect } from 'react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  accentColor?: string
}

export default function StatCard({ icon: Icon, label, value, accentColor = 'var(--primary)' }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = (y - centerY) / centerY * -5
      const rotateY = (x - centerX) / centerX * 5
      
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
    }

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0px)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: '1 1 200px',
        minWidth: '180px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Top accent glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Icon size={14} color={accentColor} />
        <span style={{
          fontSize: '10px',
          fontFamily: 'Orbitron, sans-serif',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {label}
        </span>
      </div>

      <span className="mono" style={{
        fontSize: '26px',
        fontWeight: '500',
        color: 'var(--text-primary)',
        letterSpacing: '0.03em',
      }}>
        {value}
      </span>
    </div>
  )
}