import { useState, type CSSProperties } from 'react'
import { useI18n } from '../../useI18n'
import { PRESETS, createThemePack, paletteFromPack, safePalette, contrast, type Palette } from '../../app/appearance'
import type { ThemeTokenPack } from '../../app/themeTokens'

export function ThemeSample({ palette, compact = false }: { palette: Palette; compact?: boolean }) {
  const p = safePalette(palette)
  const style = { '--sample-bg': p.background, '--sample-surface': p.surface, '--sample-accent': p.primary, '--sample-secondary': p.secondary, '--sample-text': p.text, '--sample-on': contrast(p.primary, '#ffffff') >= 4.5 ? '#ffffff' : '#000000' } as CSSProperties
  const { tr } = useI18n()
  return <div className={`theme-sample ${compact ? 'compact' : ''}`} style={style} aria-hidden={compact || undefined}>
    <div className="sample-orbit" /><div className="sample-card"><span className="sample-line" /><strong>25:00</strong><span className="sample-start">{compact ? '' : tr('Start focus', 'دەستپێکردنی سەرنج')}</span></div>
    {!compact && <span className="sample-caption">{tr('Your space to focus', 'شوێنی تایبەتت بۆ سەرنج')}</span>}
  </div>
}
export default function ThemeEditor({ saved, onSave, onCancel }: { saved: ThemeTokenPack | null; onSave: (pack: ThemeTokenPack) => void; onCancel: () => void }) {
  const { tr } = useI18n()
  const [draft, setDraft] = useState<Palette>(() => paletteFromPack(saved))
  const [name, setName] = useState(saved?.name ?? 'Custom')
  const safe = safePalette(draft)
  const adjusted = JSON.stringify(safe) !== JSON.stringify(draft)
  const fields: [keyof Palette, string][] = [['background', tr('Background', 'پاشبنەما')], ['surface', tr('Cards', 'کارتەکان')], ['primary', tr('Primary accent', 'ڕەنگی سەرەکی')], ['secondary', tr('Secondary accent', 'ڕەنگی دووەم')], ['text', tr('Text', 'دەق')]]
  return <div className="theme-editor">
    <div className="theme-editor-heading"><h3>{tr('Make it yours', 'بە ئارەزووی خۆت')}</h3><button type="button" className="settings-secondary-action" onClick={onCancel}>{tr('Cancel', 'پاشگەزبوونەوە')}</button></div>
    <div className="theme-presets" role="group" aria-label={tr('Color presets', 'ڕەنگە ئامادەکان')}>
      {Object.entries(PRESETS).map(([label, palette], i) => <button type="button" key={label} onClick={() => { setDraft(palette); setName(label) }}><i style={{ background: palette.primary, borderColor: palette.surface }} />{tr(label, ['ئۆقیانووس', 'دارستان', 'شەفەق', 'ئاوابوون', 'گرافایت'][i])}</button>)}
    </div>
    <div className="theme-editor-body"><ThemeSample palette={safe} /><div className="theme-color-fields">
      {fields.map(([key, label]) => <label key={key}><span>{label}</span><span className="color-value" dir="ltr">{draft[key]}<input aria-label={label} type="color" value={draft[key]} onChange={e => { setDraft({ ...draft, [key]: e.target.value }); setName('Custom') }} /></span></label>)}
    </div></div>
    <p className="theme-contrast-note" role="status">{adjusted ? tr('Some colors are adjusted in the preview to keep text readable.', 'هەندێک ڕەنگ ڕێکخراون بۆ ئەوەی دەقەکە ئاسان بخوێندرێتەوە.') : tr('Colors checked for readable contrast.', 'ڕەنگەکان بۆ خوێندنەوەی ئاسان پشکنراون.')}</p>
    <div className="theme-editor-actions"><button type="button" className="settings-secondary-action" onClick={() => { setDraft(PRESETS.Ocean); setName('Custom') }}>{tr('Reset to default', 'گەڕانەوە بۆ بنەڕەت')}</button>{saved && <button type="button" className="settings-secondary-action" onClick={() => { setDraft(paletteFromPack(saved)); setName(saved.name) }}>{tr('Restore saved', 'گەڕاندنەوەی پاشەکەوتکراو')}</button>}<button type="button" className="cyber-btn" onClick={() => onSave(createThemePack(safe, name))}>{tr('Save and apply', 'پاشەکەوت و جێبەجێکردن')}</button></div>
  </div>
}
