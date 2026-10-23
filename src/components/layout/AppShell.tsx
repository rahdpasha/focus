import { useEffect, type ReactNode } from 'react'
import { Timer, ChartNoAxesColumnIncreasing, Trophy, Settings, Leaf } from 'lucide-react'
import type { Subject } from '../../types'
import type { Page } from '../../app/navigation'
import { useI18n } from '../../useI18n'
interface Props { page: Page; onPageChange: (page: Page) => void; subjects: Subject[]; activeSubjectId: string | null; onSelectSubject: (id: string | null) => void; onAddSubject: (name: string, color: string) => void; onDeleteSubject: (id: string) => void; children: ReactNode }
export default function AppShell({ page, onPageChange, children }: Props) {
  const { tr, language } = useI18n()
  const items = [
    { page: 'focus' as const, label: tr('Focus', 'سەرنج'), icon: Timer },
    { page: 'progress' as const, label: tr('Progress', 'پێشکەوتن'), icon: ChartNoAxesColumnIncreasing },
    { page: 'league' as const, label: tr('League', 'پێشبڕکێ'), icon: Trophy },
    { page: 'settings' as const, label: tr('Settings', 'ڕێکخستنەکان'), icon: Settings },
  ]
  useEffect(() => { window.scrollTo(0, 0) }, [page])
  return <div className="calm-app">
    <a className="skip-link" href="#focus-main">{tr('Skip to content', 'بڕۆ بۆ ناوەڕۆک')}</a>
    <header className="calm-topbar">
      <button className="calm-brand" onClick={() => onPageChange('focus')} aria-label={tr('Focus home', 'سەرەکی سەرنج')}><span><Leaf size={22} /></span>focus<span className="brand-dot">.</span></button>
      <nav className="calm-nav" aria-label={tr('Main navigation', 'ڕێنیشاندەری سەرەکی')}>{items.map(({ page: target, label, icon: Icon }) => <button key={target} aria-current={(page === target || (page === 'plan' && target === 'settings')) ? 'page' : undefined} onClick={() => onPageChange(target)}><Icon size={19} /><span>{label}</span></button>)}</nav>
      <span className="calm-date">{new Date().toLocaleDateString(language === 'ku' ? 'ckb-IQ' : 'en-US', { month: 'short', day: 'numeric' })}</span>
    </header>
    <main id="focus-main" className="calm-content" tabIndex={-1}>{children}</main>
  </div>
}
