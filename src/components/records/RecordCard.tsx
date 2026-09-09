interface RecordCardProps {
  label: string
  value: string
}

export default function RecordCard({ label, value }: RecordCardProps) {
  return (
    <div className="glass-panel" style={{ padding: '18px' }}>
      <div
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '10px',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          color: 'var(--text-primary)',
          fontSize: '20px',
          marginTop: '10px',
        }}
      >
        {value}
      </div>
    </div>
  )
}
