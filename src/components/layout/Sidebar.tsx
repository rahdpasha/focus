import { useState } from 'react'
import {
  Hexagon,
  Plus,
  Trash2,
  X,
  Settings as SettingsIcon,
  BarChart3,
} from 'lucide-react'
import type { Subject } from '../../types'

export type Page = 'overview' | 'statistics' | 'settings'

interface SidebarProps {
  page: Page
  onPageChange: (page: Page) => void
  subjects: Subject[]
  activeSubjectId: string | null
  onSelectSubject: (id: string | null) => void
  onAddSubject: (name: string, color: string) => void
  onDeleteSubject: (id: string) => void
}

const colors = [
  '#8b5cf6',
  '#3b82f6',
  '#f59e0b',
  '#14b8a6',
  '#ef4444',
  '#ec4899',
  '#22c55e',
  '#06b6d4',
]

export default function Sidebar({
  page,
  onPageChange,
  subjects,
  activeSubjectId,
  onSelectSubject,
  onAddSubject,
  onDeleteSubject,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(colors[0])

  const handleAdd = () => {
    if (!name.trim()) return

    onAddSubject(name, color)

    setName('')
    setColor(colors[0])
    setShowAdd(false)
  }

  return (
    <aside className="app-sidebar"
      style={{
        width: collapsed ? '60px' : '240px',
        minHeight: '100vh',
        background: 'var(--void-surface)',
        borderRight: '1px solid var(--void-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        transition: 'width 0.3s ease',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 20px',
          marginBottom: '28px',
        }}
      >
        <Hexagon
          size={28}
          color="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.2}
        />

        {!collapsed && (
          <span
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '18px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              color: 'var(--text-primary)',
            }}
          >
            FOCUS
          </span>
        )}
      </div>

      {/* Overview */}
      <button
        onClick={() => onPageChange('overview')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 20px',
          margin: '0 8px 4px',
          width: 'calc(100% - 16px)',
          background:
            page === 'overview'
              ? 'var(--void-surface-hover)'
              : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color:
            page === 'overview'
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          textAlign: 'left',
          borderLeft:
            page === 'overview'
              ? '2px solid var(--primary)'
              : '2px solid transparent',
        }}
      >
        <Hexagon size={18} />
        {!collapsed && 'Overview'}
      </button>

      {/* Statistics */}
      <button
        onClick={() => onPageChange('statistics')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 20px',
          margin: '0 8px 4px',
          width: 'calc(100% - 16px)',
          background:
            page === 'statistics'
              ? 'var(--void-surface-hover)'
              : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color:
            page === 'statistics'
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          textAlign: 'left',
          borderLeft:
            page === 'statistics'
              ? '2px solid var(--cyber-blue)'
              : '2px solid transparent',
        }}
      >
        <BarChart3 size={18} />
        {!collapsed && 'Statistics'}
      </button>

      {/* Settings */}
      <button
        onClick={() => onPageChange('settings')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 20px',
          margin: '0 8px 12px',
          width: 'calc(100% - 16px)',
          background:
            page === 'settings'
              ? 'var(--void-surface-hover)'
              : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color:
            page === 'settings'
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          textAlign: 'left',
          borderLeft:
            page === 'settings'
              ? '2px solid var(--energy)'
              : '2px solid transparent',
        }}
      >
        <SettingsIcon size={18} />
        {!collapsed && 'Settings'}
      </button>

      {!collapsed && (
        <span
          style={{
            padding: '8px 20px',
            fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Subjects
        </span>
      )}

      {/* Subjects */}
      {subjects.map((subject) => {
        const isActive = activeSubjectId === subject.id

        return (
          <div
            key={subject.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '0 8px 2px',
            }}
          >
            <button
              onClick={() => onSelectSubject(subject.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: isActive
                  ? 'var(--void-surface-hover)'
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                borderLeft: isActive
                  ? `2px solid ${subject.color}`
                  : '2px solid transparent',
                color: isActive
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: subject.color,
                  boxShadow: isActive
                    ? `0 0 10px ${subject.color}80`
                    : 'none',
                  flexShrink: 0,
                }}
              />

              {!collapsed && subject.name}
            </button>

            {!collapsed && (
              <button
                onClick={() => onDeleteSubject(subject.id)}
                title={`Delete ${subject.name}`}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  opacity: 0.5,
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )
      })}

      {/* Add Subject */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 20px',
          margin: '8px',
          background: 'transparent',
          border: '1px dashed var(--void-border)',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        }}
      >
        <Plus size={18} />
        {!collapsed && 'Add Subject'}
      </button>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          marginTop: 'auto',
          padding: '10px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '18px',
        }}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {/* Add subject dialog */}
      {showAdd && !collapsed && (
        <div
          style={{
            position: 'absolute',
            left: '250px',
            bottom: '60px',
            width: '260px',
            padding: '20px',
            background: 'rgba(12, 12, 30, 0.98)',
            border: '1px solid var(--void-border)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '11px',
                color: 'var(--text-primary)',
                letterSpacing: '0.08em',
              }}
            >
              NEW SUBJECT
            </span>

            <button
              onClick={() => setShowAdd(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd()
              if (event.key === 'Escape') setShowAdd(false)
            }}
            placeholder="Subject name"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--void-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              marginBottom: '14px',
            }}
          />

          <span
            style={{
              display: 'block',
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}
          >
            COLOR
          </span>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            {colors.map((item) => (
              <button
                key={item}
                onClick={() => setColor(item)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border:
                    color === item
                      ? '2px solid white'
                      : '2px solid transparent',
                  background: item,
                  cursor: 'pointer',
                  boxShadow:
                    color === item
                      ? `0 0 10px ${item}`
                      : 'none',
                }}
              />
            ))}
          </div>

          <button
            className="cyber-btn"
            onClick={handleAdd}
            disabled={!name.trim()}
            style={{ width: '100%' }}
          >
            <Plus size={15} />
            CREATE SUBJECT
          </button>
        </div>
      )}
    </aside>
  )
}