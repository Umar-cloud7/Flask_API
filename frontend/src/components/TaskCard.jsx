const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed'
}

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TaskCard({ task, onStatusChange, onDelete, busy }) {
  const done = task.status === 'COMPLETED'
  const due = formatDate(task.dueDate)
  const created = formatDate(task.createdAt)

  return (
    <div className={`task-card status-${task.status}`}>
      <div className="task-main">
        <div className="task-title-row">
          <span className={`task-title${done ? ' done' : ''}`}>{task.title}</span>
          <span className={`pill pill-priority-${task.priority}`}>{task.priority}</span>
        </div>

        {task.description && <p className="task-desc">{task.description}</p>}

        <div className="task-meta">
          <span>#{task.id}</span>
          {created && <span>opened {created}</span>}
          {due && <span>due {due}</span>}
        </div>
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          aria-label={`Status for ${task.title}`}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={busy}
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}