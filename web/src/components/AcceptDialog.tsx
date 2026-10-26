import { useEffect, useState, type FormEvent } from 'react'
import { acceptTask } from '../api'
import { inr } from '../format'
import type { Task } from '../types'
import { Icon } from './Icons'
import { Modal } from './Modal'

type AcceptDialogProps = {
  task: Task | null
  onClose: () => void
  onAccepted: (task: Task) => void
}

export function AcceptDialog({ task, onClose, onAccepted }: AcceptDialogProps) {
  const [name, setName] = useState(() => localStorage.getItem('anyhuman.helper') ?? '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNote('')
    setError(null)
  }, [task?.id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!task || saving) return

    if (name.trim().length < 2) {
      setError('Add your name so the poster knows who is coming.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await acceptTask(task.id, { helper: name.trim(), note: note.trim() })
      localStorage.setItem('anyhuman.helper', name.trim())
      setNote('')
      onAccepted(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not take that task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Take this task"
      subtitle={task ? `${task.title} · ${task.budget === 0 ? 'a favour' : inr(task.budget)}` : undefined}
    >
      {task && (
        <form className="form" onSubmit={handleSubmit}>
          <div className="accept-summary field-full">
            <strong>{task.title}</strong>
            <span>
              {task.location} · {task.when} · posted by {task.postedBy}
            </span>
          </div>

          <label className="field field-full">
            <span>Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Who is showing up?"
              maxLength={60}
              autoFocus
            />
          </label>

          <label className="field field-full">
            <span>
              Note to {task.postedBy} <em>optional</em>
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="I've done this before, I can be there by 6."
              maxLength={280}
              rows={2}
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <p className="form-note">Settle directly with {task.postedBy}. anyhuman takes no cut.</p>
            <button className="btn btn-accent" type="submit" disabled={saving}>
              {saving ? 'Confirming…' : "I'm on it"} <Icon name="arrow" />
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
