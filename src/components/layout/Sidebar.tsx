import {
  BarChart3,
  BrainCircuit,
  Check,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gauge,
  Hexagon,
  History,
  Menu,
  Plus,
  Settings,
  Swords,
  Archive,
  Trophy,
  X,
} from 'lucide-react'
import {
  useState,
} from 'react'
import type {
  Subject,
} from '../../types'
import type {
  Page,
} from '../../app/navigation'
import {
  useI18n,
} from '../../useI18n'
import {
  SUBJECT_COLORS,
} from '../../utils/subjectManager'

interface SidebarProps {
  page: Page
  onPageChange: (
    page: Page,
  ) => void
  subjects: Subject[]
  activeSubjectId:
    | string
    | null
  onSelectSubject: (
    id: string | null,
  ) => void
  onAddSubject: (
    name: string,
    color: string,
  ) => void
  onDeleteSubject: (
    id: string,
  ) => void
}

const navGroups = [
  {
    label: 'Now',
    labelKu: 'ئێستا',
    items: [
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
        icon: Clock3,
      },
    ],
  },
  {
    label: 'Plan',
    labelKu: 'پلان',
    items: [
      {
        page: 'plan' as const,
        label: 'Plan',
        labelKu: 'پلان',
        icon: CalendarRange,
      },
      {
        page: 'advisor' as const,
        label: 'Advisor',
        labelKu: 'ڕاوێژکار',
        icon: BrainCircuit,
      },
    ],
  },
  {
    label: 'Progress',
    labelKu: 'پێشکەوتن',
    items: [
      {
        page: 'statistics' as const,
        label: 'Overview',
        labelKu: 'پوختە',
        icon: BarChart3,
      },
      {
        page: 'records' as const,
        label: 'Records',
        labelKu: 'تۆمارەکان',
        icon: Trophy,
      },
      {
        page: 'history' as const,
        label: 'History',
        labelKu: 'مێژوو',
        icon: History,
      },
    ],
  },
  {
    label: 'Community',
    labelKu: 'کۆمەڵگا',
    items: [
      {
        page: 'league' as const,
        label: 'League',
        labelKu: 'پێشبڕکێ',
        icon: Swords,
      },
    ],
  },
  {
    label: 'Preferences',
    labelKu: 'هەڵبژاردەکان',
    items: [
      {
        page: 'settings' as const,
        label: 'Settings',
        labelKu: 'ڕێکخستنەکان',
        icon: Settings,
      },
    ],
  },
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
  const { t, tr } = useI18n()
  const [
    collapsed,
    setCollapsed,
  ] = useState(false)
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false)
  const [
    showAdd,
    setShowAdd,
  ] = useState(false)
  const [name, setName] =
    useState('')
  const [
    pendingRemoval,
    setPendingRemoval,
  ] = useState<string | null>(
    null,
  )
  const [color, setColor] =
    useState<string>(
      SUBJECT_COLORS[0],
    )

  const closeMobile = () =>
    setMobileOpen(false)

  const changePage = (
    nextPage: Page,
  ) => {
    onPageChange(nextPage)
    closeMobile()
  }

  const selectSubject = (
    id: string,
  ) => {
    onSelectSubject(id)
    closeMobile()
  }

  const closeAdd = () => {
    setShowAdd(false)
    setName('')
    setColor(
      SUBJECT_COLORS[0],
    )
  }

  const createSubject = () => {
    const clean = name.trim()
    if (!clean) return

    onAddSubject(
      clean,
      color,
    )
    closeAdd()
    closeMobile()
  }

  const showLabels =
    !collapsed || mobileOpen

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() =>
          setMobileOpen(true)
        }
        aria-label={tr('Open navigation', 'کردنەوەی ڕێنوێنی')}
      >
        <Menu size={21} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          onClick={closeMobile}
          aria-label={tr('Close navigation', 'داخستنی ڕێنوێنی')}
        />
      )}

      <aside
        className={[
          'app-sidebar',
          collapsed
            ? 'is-collapsed'
            : '',
          mobileOpen
            ? 'mobile-open'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Hexagon
              size={24}
              strokeWidth={1.8}
            />
          </div>

          {showLabels && (
            <div className="sidebar-brand-copy">
              <strong>
                FOCUS
              </strong>
              <span>
                {tr('Build the day.', 'ڕۆژەکەت دروست بکە.')}
              </span>
            </div>
          )}

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={closeMobile}
            aria-label={tr('Close navigation', 'داخستنی ڕێنوێنی')}
          >
            <X size={17} />
          </button>
        </div>

        <nav
          className="sidebar-nav"
          aria-label={tr('Application navigation', 'ڕێنوێنی بەرنامە')}
        >
          {navGroups.map(
            (group) => (
              <div
                key={group.label}
                className="sidebar-nav-group"
              >
                {showLabels && (
                  <div className="sidebar-nav-group-label">
                    {tr(group.label, group.labelKu)}
                  </div>
                )}

                {group.items.map(
                  (item) => {
                    const Icon =
                      item.icon
                    const active =
                      page ===
                      item.page

                    return (
                      <button
                        key={
                          item.page
                        }
                        type="button"
                        className={
                          active
                            ? 'sidebar-nav-item active'
                            : 'sidebar-nav-item'
                        }
                        onClick={() =>
                          changePage(
                            item.page,
                          )
                        }
                        title={
                          collapsed
                            ? tr(
                                item.label,
                                item.labelKu,
                              )
                            : undefined
                        }
                        aria-current={
                          active
                            ? 'page'
                            : undefined
                        }
                      >
                        <Icon
                          size={17}
                          strokeWidth={
                            1.8
                          }
                        />

                        {showLabels && (
                          <span>
                            {tr(
                              item.label,
                              item.labelKu,
                            )}
                          </span>
                        )}
                      </button>
                    )
                  },
                )}
              </div>
            ),
          )}
        </nav>

        <div className="sidebar-divider" />

        {showLabels && (
          <div className="sidebar-section-label">
            {t('subjects')}
          </div>
        )}

        <div className="sidebar-subjects">
          {subjects.map(
            (subject) => {
              const active =
                activeSubjectId ===
                subject.id

              return (
                <div
                  key={subject.id}
                  className={
                    active
                      ? 'sidebar-subject-row active'
                      : 'sidebar-subject-row'
                  }
                >
                  <button
                    type="button"
                    className="sidebar-subject-select"
                    onClick={() =>
                      selectSubject(
                        subject.id,
                      )
                    }
                    title={
                      collapsed
                        ? subject.name
                        : undefined
                    }
                  >
                    <span
                      className="sidebar-subject-dot"
                      style={{
                        background:
                          subject.color,
                        boxShadow:
                          active
                            ? `0 0 12px ${subject.color}70`
                            : 'none',
                      }}
                    />

                    {showLabels && (
                      <span className="sidebar-subject-name">
                        {
                          subject.name
                        }
                      </span>
                    )}
                  </button>

                  {showLabels && (
                    <button
                      type="button"
                      className={
                        pendingRemoval ===
                        subject.id
                          ? 'sidebar-subject-delete confirm'
                          : 'sidebar-subject-delete'
                      }
                      onClick={() => {
                        if (
                          pendingRemoval ===
                          subject.id
                        ) {
                          onDeleteSubject(
                            subject.id,
                          )
                          setPendingRemoval(
                            null,
                          )
                          return
                        }

                        setPendingRemoval(
                          subject.id,
                        )
                      }}
                      aria-label={
                        pendingRemoval ===
                        subject.id
                          ? `${tr('Confirm removal of', 'پشتڕاستکردنەوەی لابردنی')} ${subject.name}`
                          : `${t('deleteSubject')} ${subject.name}. ${tr('Study history is preserved.', 'مێژووی خوێندن دەپارێزرێت.')}`
                      }
                      title={
                        pendingRemoval ===
                        subject.id
                          ? tr('Click again to confirm', 'دووبارە کرتە بکە بۆ پشتڕاستکردنەوە')
                          : tr('Remove subject; study history is preserved', 'بابەت لاببە؛ مێژووی خوێندن دەپارێزرێت')
                      }
                    >
                      {pendingRemoval ===
                      subject.id ? (
                        <Check
                          size={13}
                        />
                      ) : (
                        <Archive
                          size={13}
                        />
                      )}
                    </button>
                  )}
                </div>
              )
            },
          )}
        </div>

        <button
          type="button"
          className="sidebar-add-subject"
          onClick={() =>
            setShowAdd(true)
          }
          title={
            collapsed
              ? t('addSubject')
              : undefined
          }
        >
          <Plus size={16} />
          {showLabels && (
            <span>
              {t('addSubject')}
            </span>
          )}
        </button>

        <button
          type="button"
          className="sidebar-collapse"
          onClick={() =>
            setCollapsed(
              (value) =>
                !value,
            )
          }
          aria-label={
            collapsed
              ? tr('Expand navigation', 'فراوانکردنی ڕێنوێنی')
              : tr('Collapse navigation', 'کەمکردنەوەی ڕێنوێنی')
          }
        >
          {collapsed ? (
            <ChevronRight
              size={17}
            />
          ) : (
            <>
              <ChevronLeft
                size={17}
              />
              <span>
                {tr('Collapse', 'کەمکردنەوە')}
              </span>
            </>
          )}
        </button>
      </aside>

      {showAdd && (
        <div
          className="subject-dialog-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAdd()
            }
          }}
        >
          <div
            className="subject-dialog glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-dialog-title"
          >
            <div className="subject-dialog-head">
              <div>
                <div className="eyebrow">
                  {t('subjects')}
                </div>
                <h2 id="subject-dialog-title">
                  {t('newSubject')}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAdd}
                aria-label={tr('Close', 'داخستن')}
              >
                <X size={17} />
              </button>
            </div>

            <input
              autoFocus
              value={name}
              onChange={(
                event,
              ) =>
                setName(
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
                  createSubject()
                }

                if (
                  event.key ===
                  'Escape'
                ) {
                  closeAdd()
                }
              }}
              placeholder={t(
                'subjectName',
              )}
              maxLength={80}
              className="subject-dialog-input"
            />

            <div className="subject-dialog-label">
              {t('color')}
            </div>

            <div className="subject-color-grid">
              {SUBJECT_COLORS.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setColor(item)
                    }
                    aria-label={
                      `${tr('Choose', 'هەڵبژێرە')} ${item}`
                    }
                    aria-pressed={
                      color === item
                    }
                    style={{
                      background:
                        item,
                    }}
                  />
                ),
              )}
            </div>

            <button
              type="button"
              className="cyber-btn"
              disabled={!name.trim()}
              onClick={
                createSubject
              }
            >
              <Plus size={15} />
              {t(
                'createSubject',
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
