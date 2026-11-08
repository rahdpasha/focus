import { lazy, Suspense, useEffect, useState } from 'react'
import AppShell from './components/layout/AppShell'
import Settings from './components/settings/Settings'
import PageHeader from './components/layout/PageHeader'
import PageContainer from './pages/PageContainer'
import AuthScreen from './components/auth/AuthScreen'
import { useAuth } from './auth/useAuth'
import { supabase } from './api/supabaseClient'
import { useI18n } from './useI18n'
import { useTheme } from './app/useTheme'
import type { Page } from './app/navigation'
import type { TranslationKey } from './translations'
import type { AuthState } from './auth/types'
import FocusPage from './pages/FocusPage'
const MusePage = lazy(() => import('./muse/MusePage'))
const MuseAdvisor = lazy(() => import('./pages/AdvisorPage'))
const PlanPage = lazy(() => import('./pages/PlanPage'))
import Modal from './components/layout/Modal'
import ProgressPage from './pages/ProgressPage'
const LeaguePage = lazy(() => import('./pages/LeaguePage'))
import { useFocusData } from './hooks/useFocusData'
import type { RoutineSessionContext } from './storage/types'

type Translate = (key: TranslationKey) => string

function App() {
  const { t, tr } = useI18n()
  const auth = useAuth()

  if (supabase && auth.status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--void-bg)',
          color: 'var(--text-secondary)',
          fontFamily: 'Space Grotesk, sans-serif',
        }}
      >
        {tr('Preparing FOCUS…', 'FOCUS ئامادە دەکرێت…')}
      </div>
    )
  }

  if (supabase && auth.status === 'signed-out') {
    return <AuthScreen />
  }

  return (
    <AuthenticatedApp
      key={auth.session?.user.id ?? 'local'}
      t={t}
      auth={auth}
    />
  )
}

function AuthenticatedApp({
  t,
  auth,
}: {
  t: Translate
  auth: AuthState & ReturnType<typeof useAuth>
}) {
  const [museVisited, setMuseVisited] = useState(false)
  const [page, setPage] = useState<Page>('focus')
  const [planEntry, setPlanEntry] = useState<'subjects' | 'advisor'>('subjects')
  const [recommendedMinutes, setRecommendedMinutes] =
    useState<number | undefined>()
  const [
    routineSessionContext,
    setRoutineSessionContext,
  ] = useState<
    RoutineSessionContext | undefined
  >()
  const [timerActive, setTimerActive] = useState(false)
  const [showSubjectCreator, setShowSubjectCreator] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const data = useFocusData(
    t,
    undefined,
    auth.session,
  )

  const {
    language,
    setLanguage,
    tr,
  } = useI18n()
  const {
    theme,
    customThemePack,
    setTheme,
    setCustomThemePack,
  } = useTheme()

  useEffect(() => {
    if (
      theme !== data.settings.theme
    ) {
      setTheme(
        data.settings.theme,
      )
    }
  }, [
    data.settings.theme,
    setTheme,
    theme,
  ])

  useEffect(() => {
    if (
      JSON.stringify(customThemePack) !==
      JSON.stringify(
        data.settings.customThemePack,
      )
    ) {
      setCustomThemePack(
        data.settings.customThemePack,
      )
    }
  }, [
    customThemePack,
    data.settings.customThemePack,
    setCustomThemePack,
  ])

  useEffect(() => {
    if (
      language !== data.settings.language
    ) {
      setLanguage(
        data.settings.language,
      )
    }
  }, [
    data.settings.language,
    language,
    setLanguage,
  ])

  const activeSubject = data.subjects.find(
    (subject) => subject.id === data.activeSubjectId,
  )

  const startRecommendedSession = (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => {
    if (timerActive) { setPage('focus'); return }
    if (subjectId) {
      data.selectSubject(subjectId)
    }

    setRecommendedMinutes(minutes)
    setRoutineSessionContext(
      routineContext,
    )
    setPage('focus')
  }

  const handleAddSubject = (
    name: string,
    color: string,
  ) => {
    data.addSubject(name, color)
    setPage('focus')
  }

  const handleSelectSubject = (
    id: string | null,
  ) => {
    data.selectSubject(id)
    setPage('focus')
  }

  const openSubjectCreator = () => { setSubjectName(''); setShowSubjectCreator(true) }
  const openPlan = () => { setPlanEntry('subjects'); setPage('plan') }
  const openAdvisor = () => { setPlanEntry('advisor'); setPage('plan') }

  return (
    <AppShell
      page={page}
      onPageChange={next => { if (next === 'muse') setMuseVisited(true); setPage(next) }}
      subjects={data.subjects}
      activeSubjectId={data.activeSubjectId}
      onSelectSubject={handleSelectSubject}
      onAddSubject={handleAddSubject}
      onDeleteSubject={data.deleteSubject}
    >
      {<div hidden={page !== 'focus'}><FocusPage
          userId={auth.session?.user.id ?? null}
          activeSubject={activeSubject}
          subjects={data.subjects}
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
          onActivityChange={setTimerActive}
          dailyGoal={data.dailyGoal}
          routineItems={data.routineItems}
          onStartRoutine={startRecommendedSession}
          onManage={openPlan}
          onAdvisor={openAdvisor}
          shortBreak={data.settings.shortBreak}
          longBreak={data.settings.longBreak}
          sessionsBeforeLongBreak={
            data.settings.sessionsBeforeLongBreak
          }
          autoStartBreak={data.settings.autoStartBreak}
          soundEnabled={data.settings.soundEnabled}
          soundVolume={data.settings.soundVolume}
          notificationsEnabled={
            data.settings.notificationsEnabled
          }
          initialFocusMinutes={recommendedMinutes}
          routineContext={routineSessionContext}
          onAddSession={data.addSession}
          onSelectSubject={(subjectId) => {
            setRoutineSessionContext(
              undefined,
            )
            data.selectSubject(
              subjectId,
            )
          }}
          onAddSubjectRequest={() =>
            openSubjectCreator()
          }
        /></div>}

      {page === 'plan' && (<Modal title={tr('Subjects & study plan', 'بابەتەکان و پلانی خوێندن')} onClose={() => setPage('focus')}><Suspense fallback={<p>{tr('Loading…','بارکردن…')}</p>}>
        {timerActive ? <p>{tr('Finish or reset your session before editing your study plan.', 'پێش گۆڕینی پلانی خوێندن، سێشنەکەت تەواو بکە یان ڕێکی بخەرەوە.')}</p> : <PlanPage
          initialSection={planEntry}
          subjects={data.subjects}
          activeSubjectId={data.activeSubjectId}
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
          dailyGoal={data.dailyGoal}
          advancedGoals={data.advancedGoals}
          routineItems={data.routineItems}
          onSelectSubject={data.selectSubject}
          onAddSubject={data.addSubject}
          onDeleteSubject={data.deleteSubject}
          onDailyGoalChange={data.setDailyGoal}
          onWeeklyGoalChange={data.setWeeklyGoal}
          onAddAdvancedGoal={data.addAdvancedGoal}
          onUpdateAdvancedGoal={data.updateAdvancedGoal}
          onDeleteAdvancedGoal={data.deleteAdvancedGoal}
          onAddRoutineItem={data.addRoutineItem}
          onUpdateRoutineItem={data.updateRoutineItem}
          onDeleteRoutineItem={data.deleteRoutineItem}
          onStartSession={startRecommendedSession}
        />
        }
      </Suspense></Modal>)}

      {museVisited && <div hidden={page !== 'muse'}><Suspense fallback={<p>{tr('Loading Muse…','میوز بار دەکرێت…')}</p>}><MusePage
        userId={auth.session?.user.id ?? null}
        displayName={auth.session?.user.displayName}
        studyMinutes={Math.round(data.sessions.filter(session => session.completed && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad' }).format(new Date(session.completedAt)) === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad' }).format(new Date())).reduce((sum, session) => sum + session.actualDuration, 0) / 60)}
        onFocus={() => setPage('focus')}
        onSettings={() => setPage('settings')}
        advisor={timerActive ? <p>{tr('Your focus session is running. Finish it before changing your study plan.','سێشنی سەرنجەکەت بەردەوامە. پێش گۆڕینی پلان تەواوی بکە.')} <button className="cyber-btn" onClick={() => setPage('focus')}>{tr('Back to timer','گەڕانەوە بۆ کاتژمێر')}</button></p> : <MuseAdvisor
          sessions={data.sessions} subjects={data.subjects} dailyGoal={data.dailyGoal} weeklyGoal={data.weeklyGoal}
          advancedGoals={data.advancedGoals} routineItems={data.routineItems}
          onStartSession={startRecommendedSession} onDailyGoalChange={data.setDailyGoal}
          onAddAdvancedGoal={data.addAdvancedGoal} onAddRoutineItem={data.addRoutineItem}
          onUpdateAdvancedGoal={data.updateAdvancedGoal} onUpdateRoutineItem={data.updateRoutineItem}
        />}
      /></Suspense></div>}

      {page === 'progress' && (
        <ProgressPage
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
          weeklyGoalsHistory={
            data.weeklyGoalsHistory
          }
          onStartFocus={() =>
            setPage('focus')
          }
        />
      )}

      {page === 'league' && (<Suspense fallback={<p>{tr('Loading league…', 'پێشبڕکێ بار دەکرێت…')}</p>}>
        <LeaguePage
          userId={auth.session?.user.id ?? null}
          displayName={auth.session?.user.displayName}
        />
      </Suspense>)}

      {page === 'settings' && (
        <PageContainer>
          <PageHeader
            compact
            title={t('settings')}
            description={tr('Make it yours.', 'بە خواستی خۆت ڕێکی بخە.')}
          />

          <button className="calm-manage" onClick={openPlan}>{tr('Subjects & study plan', 'بابەتەکان و پلانی خوێندن')} →</button>
          <Settings
            userId={auth.session?.user.id ?? null}
            settings={data.settings}
            dailyGoal={data.dailyGoal}
            weeklyGoal={data.weeklyGoal}
            accountEmail={
              auth.session?.user.email ??
              null
            }
            cloudStatus={
              data.cloudStatus
            }
            onDailyGoalChange={data.setDailyGoal}
            onWeeklyGoalChange={data.setWeeklyGoal}
            onSettingChange={data.updateSettings}
            onExportData={data.exportData}
            onImportData={data.importData}
            onSignOut={
              auth.session
                ? () => {
                    void (async () => {
                      const flushed =
                        await data.flushCloudChanges()

                      if (!flushed) {
                        return
                      }

                      await auth.signOut()
                    })()
                  }
                : undefined
            }
          />
        </PageContainer>
      )}
      {showSubjectCreator && <Modal title={t('addSubject')} onClose={() => setShowSubjectCreator(false)}><form className="calm-subject-form" onSubmit={event => { event.preventDefault(); if (!subjectName.trim()) return; data.addSubject(subjectName.trim(), '#24766a'); setShowSubjectCreator(false) }}><label>{t('subjectName')}<input autoFocus value={subjectName} onChange={event => setSubjectName(event.target.value)} maxLength={80} required /></label><button className="cyber-btn" disabled={!subjectName.trim()}>{t('addSubject')}</button></form></Modal>}
    </AppShell>
  )
}

export default App
