import { lazy, Suspense, useState } from 'react'
import { ArrowUpRight, Flame, History, Trophy } from 'lucide-react'
import type { StudySession } from '../types'
import type { WeeklyGoalMap } from '../utils/goalHistory'
import { getFocusSummary, localDayKey } from '../utils/focusSummary'
import { useI18n } from '../useI18n'
const HistoryPage = lazy(() => import('./HistoryPage'))
const RecordsPage = lazy(() => import('./RecordsPage'))
const Statistics = lazy(() => import('../components/statistics/Statistics'))
interface Props { sessions: StudySession[]; weeklyGoal: number; weeklyGoalsHistory: WeeklyGoalMap; onStartFocus: () => void }
export default function ProgressPage({ sessions, weeklyGoal, weeklyGoalsHistory, onStartFocus }: Props) {
  const { tr, language } = useI18n()
  const [view,setView] = useState('overview')
  const stats = getFocusSummary(sessions)
  const locale = language === 'ku' ? 'ckb-IQ' : 'en-US'
  const percent = Math.min(100, Math.round(stats.weekMinutes / Math.max(weeklyGoal,1)*100))
  const maximum = Math.max(30,...stats.days.map(d => d.minutes))
  const totals = new Map<string,number>()
  sessions.filter(s => s.completed).forEach(s => { const key = localDayKey(new Date(s.completedAt)); totals.set(key,(totals.get(key) ?? 0)+s.actualDuration/60) })
  const calendar = Array.from({length:84}, (_,i) => { const day = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate()-83+i); return {day,minutes:totals.get(localDayKey(day)) ?? 0} })
  return <div className="calm-progress"><header className="calm-page-heading"><div><span className="calm-eyebrow">{tr('LITTLE BY LITTLE','هەنگاو بە هەنگاو')}</span><h1>{tr('Look how far you’re going.', 'ببین چەند پێش دەکەویت.')}</h1></div><button className="calm-text-button" onClick={onStartFocus}>{tr('Start focus','دەستپێکردنی سەرنج')}<ArrowUpRight size={18}/></button></header>
    <nav className="calm-tabs" aria-label={tr('Progress views','بەشەکانی پێشکەوتن')}>{[['overview',tr('Overview','پوختە')],['history',tr('History','مێژوو')],['records',tr('Achievements','دەستکەوتەکان')],['details',tr('Details','وردەکاری')]].map(([id,label]) => <button key={id} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}>{id === 'history' && <History size={16}/>}{id === 'records' && <Trophy size={16}/>}{label}</button>)}</nav>
    {view === 'overview' ? <>
      <div className="calm-progress-grid"><section className="calm-week-card"><div className="calm-between"><h2>{tr('This week','ئەم هەفتەیە')}</h2><span>{tr('Focused minutes','خولەکەکانی سەرنج')}</span></div><div className="calm-chart-total"><strong>{stats.weekMinutes}</strong><span>{tr('minutes invested in you','خولەک بۆ پێشکەوتنی خۆت')}</span></div><div className="calm-bars" role="img" aria-label={stats.days.map(d => `${d.date.toLocaleDateString(locale,{weekday:'long'})}: ${d.minutes}`).join(', ')}>{stats.days.map(({date,minutes}) => <div className="calm-bar-column" key={date.toISOString()}><span>{minutes || ''}</span><div className="calm-bar-track"><div className={localDayKey(date) === localDayKey(new Date()) ? 'is-today' : ''} style={{height:`${Math.max(2,minutes/maximum*100)}%`}}/></div><small>{date.toLocaleDateString(locale,{weekday:'short'})}</small></div>)}</div></section>
      <section className="calm-goal-card"><h2>{tr('Your weekly goal','ئامانجی هەفتانەت')}</h2><div className="calm-goal-ring" style={{background:`conic-gradient(var(--primary) ${percent}%, var(--primary-border) 0)`}}><div><strong>{percent}%</strong><span>{tr('of your goal','لە ئامانجەکەت')}</span></div></div><p>{stats.weekMinutes} / {weeklyGoal} {tr('minutes','خولەک')}</p><span className="calm-streak"><Flame size={17}/>{stats.streak} {tr('day streak','ڕۆژ بەردەوامی')}</span></section></div>
      <div className="calm-progress-grid"><section className="calm-activity"><div className="calm-between"><h2>{tr('Showing up adds up','بەردەوامی بەرهەم دەدات')}</h2><span>{tr('Last 12 weeks','١٢ هەفتەی ڕابردوو')}</span></div><div className="calm-heatmap">{calendar.map(({day,minutes}) => <span key={day.toISOString()} title={`${day.toLocaleDateString(locale)} · ${Math.round(minutes)} ${tr('min','خولەک')}`} aria-label={`${day.toLocaleDateString(locale)}: ${Math.round(minutes)}`} data-level={minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 90 ? 2 : 3}/>)}</div><div className="calm-heatmap-key"><span>{tr('Less','کەمتر')}</span>{[0,1,2,3].map(i => <i key={i} data-level={i}/>)}<span>{tr('More','زیاتر')}</span></div></section>
      <section className="calm-subject-progress"><h2>{tr('Time by subject','کات بەپێی بابەت')}</h2>{stats.subjects.length ? stats.subjects.map(subject => <div key={subject.name} className="calm-subject-stat"><div className="calm-between"><strong>{subject.name}</strong><span>{Math.round(subject.seconds/60)}m</span></div><progress value={subject.seconds} max={Math.max(1,stats.weekMinutes*60)} aria-label={subject.name}/></div>) : <p>{tr('Your first session starts the story.','یەکەم سێشنەکەت دەستپێکی چیرۆکەکەیە.')}</p>}</section></div>
    </> : <Suspense fallback={<p>{tr('Loading…','بارکردن…')}</p>}>{view === 'history' ? <HistoryPage sessions={sessions}/> : view === 'records' ? <RecordsPage sessions={sessions} weeklyGoal={weeklyGoal}/> : <Statistics sessions={sessions} weeklyGoal={weeklyGoal} weeklyGoalsHistory={weeklyGoalsHistory}/>}</Suspense>}
  </div>
}
