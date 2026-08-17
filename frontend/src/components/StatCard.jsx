const ACCENTS = {
  indigo: '#818cf8',
  amber: '#f59e0b',
  blue: '#3b82f6',
  emerald: '#10b981',
  red: '#f87171'
}

export default function StatCard({ title, value, subtitle, icon, color }) {
  const accent = ACCENTS[color] || '#818cf8'

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '14px',
        padding: '18px 20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div
          style={{
            background: `${accent}1f`,
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {icon}
        </div>
        <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>{title}</span>
      </div>
      <div style={{ fontSize: '30px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>{subtitle}</div>
      )}
    </div>
  )
}
