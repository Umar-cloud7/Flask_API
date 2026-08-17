import { useState } from 'react'

const empty = { title: '', description: '', priority: 'MEDIUM', dueDate: '' }

export default function TaskForm({ onCreate, creating }) {
  const [form, setForm] = useState(empty)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    await onCreate(form)
    setForm(empty)
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form-grid">
        <div className="field full">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="What needs doing?"
            required
          />
        </div>

        <div className="field full">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Add any detail worth remembering later (optional)"
          />
        </div>

        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="dueDate">Due date</label>
          <input
            id="dueDate"
            type="date"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={creating}>
        {creating ? 'Adding…' : 'Add task'}
      </button>
    </form>
  )
}