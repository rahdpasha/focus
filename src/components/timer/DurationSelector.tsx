import { useState } from 'react'
import { useI18n } from '../../useI18n'

interface DurationSelectorProps {
  duration: number
  onSelect: (duration: number) => void
  disabled?: boolean
}

const durations = [
  { label: '10 sec', value: 10 },
  { label: '25 min', value: 25 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
]

export default function DurationSelector({
  duration,
  onSelect,
  disabled = false,
}: DurationSelectorProps) {
  const { t } = useI18n()
  const [showCustom, setShowCustom] =
    useState(false)
  const [customMinutes, setCustomMinutes] =
    useState('')

  const isPreset =
    durations.some(
      (item) =>
        item.value ===
        duration,
    )

  const handleCustom = () => {
    const minutes =
      Number(customMinutes)

    if (
      !Number.isFinite(
        minutes,
      )
    ) {
      return
    }

    if (
      minutes < 1 ||
      minutes > 240
    ) {
      return
    }

    onSelect(
      Math.round(
        minutes * 60,
      ),
    )
    setShowCustom(false)
    setCustomMinutes('')
  }

  return (
    <div className="duration-v5">
      <div className="duration-v5-presets">
        {durations.map(
          (item) => {
            const active =
              duration ===
              item.value

            return (
              <button
                key={
                  item.value
                }
                type="button"
                className={
                  active
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  onSelect(
                    item.value,
                  )
                }
                disabled={
                  disabled
                }
              >
                {item.value ===
                10
                  ? t(
                      'tenSec',
                    )
                  : item.value ===
                      25 * 60
                    ? t(
                        'minutes25',
                      )
                    : item.value ===
                        45 * 60
                      ? t(
                          'minutes45',
                        )
                      : t(
                          'minutes60',
                        )}
              </button>
            )
          },
        )}

        <button
          type="button"
          className={
            !isPreset
              ? 'active'
              : ''
          }
          onClick={() =>
            setShowCustom(
              (value) =>
                !value,
            )
          }
          disabled={
            disabled
          }
        >
          {t('custom')}
        </button>
      </div>

      {showCustom && (
        <div className="duration-v5-custom">
          <input
            autoFocus
            type="number"
            min="1"
            max="240"
            step="1"
            value={
              customMinutes
            }
            onChange={(
              event,
            ) =>
              setCustomMinutes(
                event.target
                  .value,
              )
            }
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                'Enter'
              ) {
                handleCustom()
              }

              if (
                event.key ===
                'Escape'
              ) {
                setShowCustom(
                  false,
                )
              }
            }}
            placeholder={t(
              'minutes',
            )}
          />

          <button
            type="button"
            className="duration-v5-set"
            onClick={
              handleCustom
            }
            disabled={
              !customMinutes
            }
          >
            {t('set')}
          </button>
        </div>
      )}
    </div>
  )
}
