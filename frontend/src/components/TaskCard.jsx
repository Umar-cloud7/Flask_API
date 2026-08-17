const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed'
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const PRIORITY_COLOR = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f87171'
}

export default function TaskCard({ task, onStatusChange, onPriorityChange, onDelete, busy }) {
  const done = task.status === 'COMPLETED'
  const due = formatDate(task.dueDate)
  const created = formatDate(task.createdAt)
  const priorityColor = PRIORITY_COLOR[task.priority] || '#9ca3af'

  const selectStyle = {
    background: '#1f2937',
    color: '#fff',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    cursor: 'pointer'
  }

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: done ? '#6b7280' : '#fff',
              textDecoration: done ? 'line-through' : 'none',
              flex: 1,
              wordBreak: 'break-word'
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              background: `${priorityColor}1f`,
              color: priorityColor,
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '99px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.5 }}>
            {task.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '14px',
            color: '#6b7280',
            fontSize: '12px',
            flexWrap: 'wrap'
          }}
        >
          <span>#{task.id}</span>
          {created && <span>opened {created}</span>}
          {due && <span>due {due}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          style={selectStyle}
          aria-label={`Status for ${task.title}`}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={task.priority}
          disabled={busy}
          onChange={(e) => onPriorityChange && onPriorityChange(task.id, e.target.value)}
          style={selectStyle}
          aria-label={`Priority for ${task.title}`}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(task.id)}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}