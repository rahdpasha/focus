import {
  CalendarRange,
  Gauge,
  Repeat2,
  Swords,
  TimerReset,
} from 'lucide-react'
import type { Page } from '../../app/navigation'
import { useI18n } from '../../useI18n'

interface MobileDockProps {
  page: Page
  onPageChange: (page: Page) => void
}

const items = [
  {
    page: 'dashboard' as const,
    labelKey: 'dashboard' as const,
    icon: Gauge,
  },
  {
    page: 'focus' as const,
    labelKey: 'focus' as const,
    icon: TimerReset,
  },
  {
    page: 'study-plan' as const,
    labelKey: 'studyPlan' as const,
    icon: CalendarRange,
  },
  {
    page: 'routine' as const,
    labelKey: 'routine' as const,
    icon: Repeat2,
  },
  {
    page: 'league' as const,
    labelKey: 'league' as const,
    icon: Swords,
  },
]

export default function MobileDock({
  page,
  onPageChange,
}: MobileDockProps) {
  const { t } = useI18n()

  return (
    <nav
      className="mobile-dock"
      aria-label="Primary mobile navigation"
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = page === item.page

        return (
          <button
            key={item.page}
            type="button"
            className={
              active
                ? 'mobile-dock-item active'
                : 'mobile-dock-item'
            }
            onClick={() =>
              onPageChange(item.page)
            }
            aria-current={
              active ? 'page' : undefined
            }
          >
            <Icon size={18} />
            <span>{t(item.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
