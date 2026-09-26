import {
  CalendarRange,
  Gauge,
  BarChart3,
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
    label: 'Today',
    labelKu: 'ئەمڕۆ',
    icon: Gauge,
  },
  {
    page: 'focus' as const,
    label: 'Focus',
    labelKu: 'سەرنج',
    icon: TimerReset,
  },
  {
    page: 'plan' as const,
    label: 'Plan',
    labelKu: 'پلان',
    icon: CalendarRange,
  },
  {
    page: 'statistics' as const,
    label: 'Progress',
    labelKu: 'پێشکەوتن',
    icon: BarChart3,
  },
  {
    page: 'league' as const,
    label: 'League',
    labelKu: 'پێشبڕکێ',
    icon: Swords,
  },
]

export default function MobileDock({
  page,
  onPageChange,
}: MobileDockProps) {
  const { tr } = useI18n()

  return (
    <nav
      className="mobile-dock"
      aria-label={tr('Primary mobile navigation', 'ڕێنیشاندەری سەرەکی مۆبایل')}
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
            <span>{tr(item.label, item.labelKu)}</span>
          </button>
        )
      })}
    </nav>
  )
}
