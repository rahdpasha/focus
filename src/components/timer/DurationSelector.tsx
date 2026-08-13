import { useState } from 'react'
import { useI18n } from '../../useI18n'

interface DurationSelectorProps {
  duration: number
  onSelect: (duration: number) => void
  disabled?: boolean
}

const durations = [
  { label: '10 SEC', value: 10 },
  { label: '25 MIN', value: 25 * 60 },
  { label: '45 MIN', value: 45 * 60 },
  { label: '60 MIN', value: 60 * 60 },
]

export default function DurationSelector({
  duration,
  onSelect,
  disabled = false,
}: DurationSelectorProps) {
  const { t } = useI18n()

  const [showCustom, setShowCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')

  const isPreset = durations.some(
    (item) => item.value === duration
  )

  const handleCustom = () => {
    const minutes = Number(customMinutes)

    if (!Number.isFinite(minutes)) return
    if (minutes < 1 || minutes > 240) return

    onSelect(Math.round(minutes * 60))
    setShowCustom(false)
    setCustomMinutes('')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {durations.map((item) => (
          <button
            key={item.value}
            className="cyber-btn"
            onClick={() => onSelect(item.value)}
            disabled={disabled}
            style={{
              opacity:
                duration === item.value ? 1 : 0.55,
              borderColor:
                duration === item.value
                  ? 'var(--energy)'
                  : 'var(--void-border)',
            }}
          >
            {item.value === 10
              ? t('tenSec')
              : item.value === 25 * 60
                ? t('minutes25')
                : item.value === 45 * 60
                  ? t('minutes45')
                  : t('minutes60')}
          </button>
        ))}

        <button
          className="cyber-btn"
          onClick={() =>
            setShowCustom((value) => !value)
          }
          disabled={disabled}
          style={{
            opacity: !isPreset ? 1 : 0.55,
            borderColor: !isPreset
              ? 'var(--energy)'
              : 'var(--void-border)',
          }}
        >
          {t('custom')}
        </button>
      </div>

      {showCustom && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <input
            autoFocus
            type="number"
            min="1"
            max="240"
            step="1"
            value={customMinutes}
            onChange={(event) =>
              setCustomMinutes(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleCustom()
              }

              if (event.key === 'Escape') {
                setShowCustom(false)
              }
            }}
            placeholder={t('minutes')}
            style={{
              width: '110px',
              padding: '10px 12px',
              background: 'var(--void-surface-hover)',
              border: '1px solid var(--void-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />

          <button
            className="cyber-btn"
            onClick={handleCustom}
            disabled={!customMinutes}
          >
            {t('set')}
          </button>
        </div>
      )}
    </div>
  )
}
