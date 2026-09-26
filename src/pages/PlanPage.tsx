import {
  BookOpen,
  CalendarRange,
  Repeat2,
} from 'lucide-react'
import { useState } from 'react'
import type {
  Subject,
  StudySession,
} from '../types'
import type {
  AdvancedGoal,
  RoutineItem,
  RoutineSessionContext,
} from '../storage/types'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import StudyPlanPage from './StudyPlanPage'
import SubjectsPage from './SubjectsPage'
import RoutinePage from './RoutinePage'

type PlanSection =
  | 'plan'
  | 'subjects'
  | 'routine'

interface PlanPageProps {
  subjects: Subject[]
  activeSubjectId: string | null
  sessions: StudySession[]
  weeklyGoal: number
  dailyGoal: number
  advancedGoals: AdvancedGoal[]
  routineItems: RoutineItem[]
  onSelectSubject: (id: string | null) => void
  onAddSubject: (
    name: string,
    color: string,
  ) => void
  onDeleteSubject: (id: string) => void
  onDailyGoalChange: (value: number) => void
  onWeeklyGoalChange: (value: number) => void
  onAddAdvancedGoal: (
    title: string,
    targetMinutes: number,
    deadline: string,
    priority: AdvancedGoal['priority'],
    subjectId?: string,
  ) => void
  onUpdateAdvancedGoal: (
    id: string,
    patch: Partial<
      Omit<
        AdvancedGoal,
        'id' | 'createdAt'
      >
    >,
  ) => void
  onDeleteAdvancedGoal: (
    id: string,
  ) => void
  onAddRoutineItem: (
    title: string,
    subjectId: string,
    targetMinutes: number,
    mode: RoutineItem['mode'],
    daysOfWeek?: number[],
    recoveryDays?: number,
  ) => void
  onUpdateRoutineItem: (
    id: string,
    patch: Partial<
      Omit<
        RoutineItem,
        'id' | 'createdAt'
      >
    >,
  ) => void
  onDeleteRoutineItem: (
    id: string,
  ) => void
  onStartSession: (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => void
}

export default function PlanPage({
  subjects,
  activeSubjectId,
  sessions,
  weeklyGoal,
  dailyGoal,
  advancedGoals,
  routineItems,
  onSelectSubject,
  onAddSubject,
  onDeleteSubject,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onAddAdvancedGoal,
  onUpdateAdvancedGoal,
  onDeleteAdvancedGoal,
  onAddRoutineItem,
  onUpdateRoutineItem,
  onDeleteRoutineItem,
  onStartSession,
}: PlanPageProps) {
  const { tr } = useI18n()
  const [section, setSection] =
    useState<PlanSection>('plan')

  const tabs = [
    {
      id: 'plan' as const,
      label: tr(
        'Plan & goals',
        'پلان و ئامانجەکان',
      ),
      icon: CalendarRange,
    },
    {
      id: 'subjects' as const,
      label: tr(
        'Subjects',
        'بابەتەکان',
      ),
      icon: BookOpen,
    },
    {
      id: 'routine' as const,
      label: tr(
        'Routine',
        'ڕوتین',
      ),
      icon: Repeat2,
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={tr(
          'Plan',
          'پلان',
        )}
        description={tr(
          'Keep your subjects, goals, and routine together. Choose only what you need right now.',
          'بابەت، ئامانج و ڕوتینەکانت لە یەک شوێندا ڕێکبخە. تەنها ئەوە هەڵبژێرە کە ئێستا پێویستتە.',
        )}
      />

      <nav
        className="plan-v4-tabs"
        aria-label={tr(
          'Plan sections',
          'بەشەکانی پلان',
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active =
            section === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={
                active
                  ? 'plan-v4-tab active'
                  : 'plan-v4-tab'
              }
              onClick={() =>
                setSection(tab.id)
              }
              aria-current={
                active
                  ? 'page'
                  : undefined
              }
            >
              <Icon size={16} />
              <span>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="plan-v4-body">
        {section === 'plan' && (
          <StudyPlanPage
            sessions={sessions}
            subjects={subjects}
            weeklyGoal={weeklyGoal}
            dailyGoal={dailyGoal}
            advancedGoals={
              advancedGoals
            }
            onDailyGoalChange={
              onDailyGoalChange
            }
            onWeeklyGoalChange={
              onWeeklyGoalChange
            }
            onAddAdvancedGoal={
              onAddAdvancedGoal
            }
            onUpdateAdvancedGoal={
              onUpdateAdvancedGoal
            }
            onDeleteAdvancedGoal={
              onDeleteAdvancedGoal
            }
            onStartSession={
              onStartSession
            }
          />
        )}

        {section ===
          'subjects' && (
          <SubjectsPage
            subjects={subjects}
            activeSubjectId={
              activeSubjectId
            }
            sessions={sessions}
            onSelectSubject={
              onSelectSubject
            }
            onAddSubject={
              onAddSubject
            }
            onDeleteSubject={
              onDeleteSubject
            }
            onStartSession={
              onStartSession
            }
          />
        )}

        {section ===
          'routine' && (
          <RoutinePage
            subjects={subjects}
            sessions={sessions}
            routineItems={
              routineItems
            }
            onAddRoutineItem={
              onAddRoutineItem
            }
            onUpdateRoutineItem={
              onUpdateRoutineItem
            }
            onDeleteRoutineItem={
              onDeleteRoutineItem
            }
            onStartSession={
              onStartSession
            }
          />
        )}
      </div>
    </PageContainer>
  )
}
