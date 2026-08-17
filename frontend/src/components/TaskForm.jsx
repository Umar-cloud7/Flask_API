import { useState } from 'react'

const empty = { title: '', description: '', priority: 'MEDIUM', dueDate: '' }

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: '#0b0f19',
  border: '1px solid #374151',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit'
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#d1d5db',
  marginBottom: '6px'
}

export default function TaskForm({ onSubmit, onClose }) {
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm(empty)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 20px' }}>
          Create Task
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="What needs doing?"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle} htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Add any detail worth remembering later (optional)"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
              style={inputStyle}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="dueDate">Due date</label>
            <input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                color: '#d1d5db',
                borderRadius: '10px',
                padding: '12px 20px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  )
}