import { Plus, Trash2 } from 'lucide-react'
import type { Subject } from '../types'
import { useI18n } from '../useI18n'
import PageContainer from './PageContainer'
import { SUBJECT_COLORS } from '../utils/subjectManager'

interface SubjectsPageProps {
  subjects: Subject[]
  activeSubjectId: string | null
  onSelectSubject: (id: string | null) => void
  onAddSubject: (name: string, color: string) => void
  onDeleteSubject: (id: string) => void
}

export default function SubjectsPage({
  subjects,
  activeSubjectId,
  onSelectSubject,
  onAddSubject,
  onDeleteSubject,
}: SubjectsPageProps) {
  const { t } = useI18n()

  const addSubject = () => {
    const name = window.prompt(t('subjectName'))?.trim()
    if (name) onAddSubject(name, SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length])
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>{t('subjects')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>{t('subjectsPageQuestion')}</p>
        </div>
        <button className="cyber-btn" onClick={addSubject}><Plus size={15} />{t('addSubject')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {subjects.map((subject) => {
          const active = subject.id === activeSubjectId
          return (
            <div key={subject.id} className="glass-panel" style={{ padding: '18px', borderColor: active ? subject.color : undefined }}>
              <button onClick={() => onSelectSubject(active ? null : subject.id)} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--text-primary)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: subject.color, boxShadow: active ? `0 0 12px ${subject.color}80` : 'none' }} />
                  <strong>{subject.name}</strong>
                </div>
                <div style={{ color: active ? subject.color : 'var(--text-muted)', fontSize: '10px', marginTop: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {active ? 'ACTIVE SUBJECT' : 'SELECT SUBJECT'}
                </div>
              </button>
              <button onClick={() => onDeleteSubject(subject.id)} aria-label={`${t('deleteSubject')} ${subject.name}`} style={{ marginTop: '12px', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--void-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}
