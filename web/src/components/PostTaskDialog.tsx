import { useState, type FormEvent } from 'react'
import { createTask } from '../api'
import { CATEGORIES, type NewTask, type Task } from '../types'
import { Icon } from './Icons'
import { Modal } from './Modal'

type PostTaskDialogProps = {
  open: boolean
  onClose: () => void
  onCreated: (task: Task) => void
}

function makeInitialForm() {
  return {
    title: '',
    description: '',
    category: CATEGORIES[0] as string,
    budget: '',
    location: '',
    when: '',
    postedBy: localStorage.getItem('anyhuman.name') ?? '',
  }
}

export function PostTaskDialog({ open, onClose, onCreated }: PostTaskDialogProps) {
  const [form, setForm] = useState(makeInitialForm)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField(key: keyof ReturnType<typeof makeInitialForm>, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return

    setError(null)
    const budget = Number(form.budget || 0)

    if (form.title.trim().length < 3) {
      setError('Give your task a clear title (at least 3 characters).')
      return
    }
    if (!form.location.trim()) {
      setError('Where should the human show up?')
      return
    }
    if (!form.when.trim()) {
      setError('Tell helpers when you need them.')
      return
    }
    if (!form.postedBy.trim()) {
      setError('Add your name so helpers know who they are helping.')
      return
    }
    if (!Number.isFinite(budget) || budget < 0) {
      setError('Enter a valid budget. Zero is fine for a favour.')
      return
    }

    const payload: NewTask = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      budget,
      location: form.location.trim(),
      when: form.when.trim(),
      postedBy: form.postedBy.trim(),
    }

    setSaving(true)
    try {
      const task = await createTask(payload)
      localStorage.setItem('anyhuman.name', payload.postedBy)
      setForm(makeInitialForm())
      onCreated(task)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Post a task"
      subtitle="Anything a human can do. No limits, no agencies, no membership."
    >
      <form className="form" onSubmit={handleSubmit}>
        <label className="field field-full">
          <span>What do you need?</span>
          <input
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            placeholder="e.g. Sit with my dad and talk cricket"
            maxLength={120}
            autoFocus
          />
        </label>

        <label className="field field-full">
          <span>
            Details <em>optional</em>
          </span>
          <textarea
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="Tools, access, quirks, or anything a helper should know."
            maxLength={1000}
            rows={3}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={(event) => setField('category', event.target.value)}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Budget (₹)</span>
          <input
            type="number"
            min={0}
            step={50}
            value={form.budget}
            onChange={(event) => setField('budget', event.target.value)}
            placeholder="0 for a favour"
          />
        </label>

        <label className="field">
          <span>Where</span>
          <input
            value={form.location}
            onChange={(event) => setField('location', event.target.value)}
            placeholder="Area, city, or online"
            maxLength={120}
          />
        </label>

        <label className="field">
          <span>When</span>
          <input
            value={form.when}
            onChange={(event) => setField('when', event.target.value)}
            placeholder="Today, 7:00 PM"
            maxLength={80}
          />
        </label>

        <label className="field field-full">
          <span>Your name</span>
          <input
            value={form.postedBy}
            onChange={(event) => setField('postedBy', event.target.value)}
            placeholder="Aarav"
            maxLength={60}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <p className="form-note">No fees. No commission. Helpers accept what they can actually do.</p>
          <button className="btn btn-accent" type="submit" disabled={saving}>
            {saving ? 'Posting…' : 'Post task'} <Icon name="arrow" />
          </button>
        </div>
      </form>
    </Modal>
  )
}
