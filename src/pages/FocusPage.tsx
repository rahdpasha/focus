import { createClientId } from '../utils/clientId'
import { useCallback, useRef, useState } from 'react'
import { Plus, BookOpen, Flame, ArrowUpRight, Check, Headphones } from 'lucide-react'
import Timer from '../components/timer/Timer'
import type { Subject, StudySession, Subtask } from '../types'
import type { RoutineItem, RoutineSessionContext } from '../storage/types'
import { useI18n } from '../useI18n'
import { supabase } from '../api/supabaseClient'
import { ambientAudio, type AmbientSoundType } from '../utils/ambientAudio'
import { getRoutineItemsForDate, getRoutineMinutesForDate, toRoutineDateKey } from '../utils/routine'
import { getFocusSummary } from '../utils/focusSummary'
interface FocusPageProps {
  onActivityChange: (active: boolean) => void
  dailyGoal: number
  routineItems: RoutineItem[]
  onStartRoutine: (id?: string, minutes?: number, context?: RoutineSessionContext) => void
  onManage: () => void
  userId?: string | null
  activeSubject:
    | Subject
    | undefined
  subjects?: Subject[]
  sessions?: StudySession[]
  weeklyGoal?: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
  initialFocusMinutes?: number
  routineContext?: RoutineSessionContext
  onAddSession: (
    session: StudySession,
  ) => void
  onSelectSubject?: (
    subjectId: string,
  ) => void
  onAddSubjectRequest?: () => void
}


export default function FocusPage({ userId, activeSubject, subjects = [], sessions = [], dailyGoal, routineItems, onStartRoutine, onManage, shortBreak, longBreak, sessionsBeforeLongBreak, autoStartBreak, soundEnabled, soundVolume, notificationsEnabled, onActivityChange, initialFocusMinutes, routineContext, onAddSession, onSelectSubject, onAddSubjectRequest }: FocusPageProps) {
  const { t, tr } = useI18n()
  const [timerBusy, setTimerBusy] = useState(false)
  const targetSubject = activeSubject ?? subjects[0]
  const [boundSubject, setBoundSubject] = useState<Subject | undefined>()
  const sessionSubject = boundSubject ?? targetSubject
  const handleActivity = useCallback((active: boolean) => { setTimerBusy(active); onActivityChange(active); setBoundSubject(previous => active ? (previous ?? targetSubject) : undefined) }, [targetSubject, onActivityChange])
  const [sessionNotes, setSessionNotes] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [step, setStep] = useState('')
  const [ambient, setAmbient] = useState<AmbientSoundType>('off')
  const summary = getFocusSummary(sessions)
  const routine = getRoutineItemsForDate(routineItems, new Date())
  const resetIntent = () => { setSessionNotes(''); setSubtasks([]) }
  const pushJobQueue = useRef<Promise<unknown>>(Promise.resolve())

  function queueTimerJob(run: () => Promise<unknown>) {
    pushJobQueue.current = pushJobQueue.current.then(run).catch((error: unknown) => {
      console.warn('[FOCUS] Background completion unavailable:', error)
    })
  }

  function changeTimerJob(sessionClientId: string, values: Record<string, unknown>) {
    const client = supabase
    if (!client || !userId) return
    queueTimerJob(async () => {
      const { error } = await client
        .from('focus_timer_jobs')
        .update(values)
        .eq('user_id', userId)
        .eq('session_client_id', sessionClientId)
      if (error) throw error
    })
  }

  function scheduleTimerJob(startedAt: Date, sessionClientId: string, seconds: number, endAt: number) {
    const client = supabase
    if (!client || !userId || !sessionSubject) return
    const subjectId = sessionSubject.id
    const subjectName = sessionSubject.name
    queueTimerJob(async () => {
      const { error } = await client.from('focus_timer_jobs').upsert({
        user_id: userId,
        session_client_id: sessionClientId,
        subject_client_id: subjectId,
        subject_name: subjectName,
        duration_seconds: seconds,
        started_at: startedAt.toISOString(),
        due_at: new Date(endAt).toISOString(),
        status: 'active',
      }, { onConflict: 'user_id,session_client_id' })
      if (error) throw error
    })
  }


  return <div className="calm-focus">
    <header className="calm-page-heading"><div><span className="calm-eyebrow">{tr('MAKE A LITTLE ROOM', 'کەمێک کات بۆ خۆت')}</span><h1>{tr('Ready to focus?', 'ئامادەیت بۆ سەرنج؟')}</h1></div><span className="calm-streak"><Flame size={17} />{summary.streak} {tr('day streak', 'ڕۆژ بەردەوامی')}</span></header>
    <div className="calm-focus-grid">
      <section className="calm-timer-card">
        <div className="calm-subject-picker"><BookOpen size={18} /><select aria-label={t('selectSubject')} value={targetSubject?.id ?? ''} disabled={timerBusy} onChange={e => onSelectSubject?.(e.target.value)}>{!subjects.length && <option value="">{tr('Choose a subject', 'بابەتێک هەڵبژێرە')}</option>}{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><button disabled={timerBusy} onClick={onAddSubjectRequest} aria-label={t('addSubject')}><Plus size={19} /></button></div>
        {sessionSubject ? <div className="calm-timer-body">
            <Timer
              persistenceKey={`focus.activeTimer.v1:${userId ?? "local"}`}
              subjectName={
                sessionSubject?.name ||
                t(
                  'selectSubject',
                )
              }
              subjectColor={
                sessionSubject?.color ||
                '#8b5cf6'
              }
              shortBreakMinutes={
                shortBreak
              }
              longBreakMinutes={
                longBreak
              }
              sessionsBeforeLongBreak={
                sessionsBeforeLongBreak
              }
              autoStartBreak={
                autoStartBreak
              }
              soundEnabled={
                soundEnabled
              }
              soundVolume={
                soundVolume
              }
              notificationsEnabled={
                notificationsEnabled
              }
              initialFocusMinutes={
                initialFocusMinutes
              }
              onComplete={() =>
                ambientAudio.stop()
              }
              onActivityChange={handleActivity}
              onSessionStart={scheduleTimerJob}
              onSessionPause={(id, paused, interruptions) =>
                changeTimerJob(id, { status: 'paused', total_paused_seconds: paused, interruptions })
              }
              onSessionResume={(id, endAt, paused) =>
                changeTimerJob(id, { status: 'active', due_at: new Date(endAt).toISOString(), total_paused_seconds: paused })
              }
              onSessionCancel={(id) => changeTimerJob(id, { status: 'cancelled' })}
              onSessionCompleted={(id) => changeTimerJob(id, { status: 'completed', completed_at: new Date().toISOString() })}
              onSessionEnd={(
                duration,
                actualDuration,
                completed,
                interruptions,
                totalPausedSeconds,
                startedAt,
                sessionClientId,
                completedAt,
              ) => {
                ambientAudio.stop()

                if (
                  !sessionSubject
                ) {
                  console.warn(
                    '[FocusPage] Cannot save session: No subjects exist.',
                  )
                  return
                }

                onAddSession({
                  id: sessionClientId,
                  subjectId:
                    sessionSubject.id,
                  subjectName:
                    sessionSubject.name,
                  subjectColor:
                    sessionSubject.color,
                  duration,
                  actualDuration,
                  startedAt,
                  completedAt: completedAt ?? new Date(),
                  completed,
                  interruptions,
                  totalPausedSeconds,
                  notes:
                    sessionNotes.trim() ||
                    undefined,
                  subtasks:
                    subtasks.length >
                    0
                      ? subtasks
                      : undefined,
                  routineItemId:
                    routineContext
                      ?.itemId,
                  routineDate:
                    routineContext
                      ?.routineDate,
                })

                resetIntent()
              }}
            />
        </div> : <div className="calm-empty-timer"><div className="calm-empty-ring"><strong>25:00</strong><span>{tr('Room for your next idea', 'شوێنێک بۆ بیرۆکەی داهاتووت')}</span></div><button className="cyber-btn" onClick={onAddSubjectRequest}><Plus size={18}/>{tr('Add your first subject', 'یەکەم بابەتت زیاد بکە')}</button></div>}
        <details className="calm-session-options"><summary><Headphones size={16}/>{tr('Sound & notes', 'دەنگ و تێبینی')}</summary><label>{tr('Background sound', 'دەنگی پاشبنەما')}<select value={ambient} onChange={e => { const value = e.target.value as AmbientSoundType; setAmbient(value); if(value === 'off') ambientAudio.stop(); else ambientAudio.play(value, soundVolume / 100) }}><option value="off">{tr('Off','کوژاوە')}</option><option value="brown">{tr('Brown noise','دەنگی براون')}</option><option value="pink">{tr('Pink noise','دەنگی پینک')}</option><option value="white">{tr('White noise','دەنگی سپی')}</option><option value="binaural">{tr('Alpha','ئەلفا')}</option></select></label><label>{tr('Session note', 'تێبینی سێشن')}<textarea rows={2} value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} maxLength={1000}/></label><div className="calm-checklist">{subtasks.map(task => <label key={task.id}><input type="checkbox" checked={task.completed} onChange={e => setSubtasks(items => items.map(item => item.id === task.id ? {...item, completed: e.target.checked} : item))}/>{task.text}<button onClick={() => setSubtasks(items => items.filter(item => item.id !== task.id))} aria-label={tr('Remove step','لابردنی هەنگاو')}>×</button></label>)}<form onSubmit={e => { e.preventDefault(); if(step.trim()) {setSubtasks(items => [...items,{id:createClientId(),text:step.trim(),completed:false}]);setStep('')} }}><input aria-label={tr('Add a step','زیادکردنی هەنگاو')} placeholder={tr('Add a step','زیادکردنی هەنگاو')} value={step} onChange={e => setStep(e.target.value)} maxLength={160}/><button disabled={!step.trim()}>{tr('Add','زیادکردن')}</button></form></div></details>
      </section>
      <aside className="calm-focus-aside">
        <section className="calm-today"><span className="calm-eyebrow">{tr('TODAY', 'ئەمڕۆ')}</span><div className="calm-today-value"><strong>{summary.todayMinutes}</strong><span>{tr('minutes focused', 'خولەک سەرنج')}</span></div><progress value={summary.todayMinutes} max={Math.max(dailyGoal, summary.todayMinutes, 1)} aria-label={tr('Daily goal', 'ئامانجی ڕۆژانە')}/><div className="calm-between"><span>{summary.todaySessions} {tr('sessions', 'سێشن')}</span><span>{dailyGoal} {tr('min goal', 'خولەک ئامانج')}</span></div></section>
        <section className="calm-plan"><div className="calm-between"><h2>{tr('Your study rhythm', 'ڕێتمی خوێندنت')}</h2><button onClick={onManage} aria-label={tr('Manage study plan','ڕێکخستنی پلانی خوێندن')}><ArrowUpRight size={19}/></button></div>{routine.length ? routine.map(item => {const done = getRoutineMinutesForDate(item, sessions, new Date()) >= item.targetMinutes; return <button className="calm-routine" key={item.id} disabled={timerBusy || !subjects.some(s => s.id === item.subjectId)} onClick={() => onStartRoutine(item.subjectId, item.targetMinutes, { itemId: item.id, routineDate: toRoutineDateKey(new Date()) })}><span className={done ? 'routine-check done' : 'routine-check'}>{done && <Check size={14}/>}</span><span><strong>{item.title}</strong><small>{item.mode === 'fixed' ? tr('Fixed','جێگیر') : tr('Rotation','خولانەوە')}</small></span><span>{item.targetMinutes}m</span></button>}) : <><p>{tr('Choose one subject, or set up a simple rotation.', 'بابەتێک هەڵبژێرە، یان خولانەوەیەکی سادە ڕێکبخە.')}</p><button className="calm-text-button" onClick={onManage}>{tr('Set up a study plan', 'پلانی خوێندن ڕێکبخە')} →</button></>}</section>
        <p className="calm-quiet-note">{tr('One session is a good start.', 'یەک سێشن دەستپێکێکی باشە.')}</p>
      </aside>
    </div>
  </div>
}
