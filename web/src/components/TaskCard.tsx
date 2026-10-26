import { inr } from '../format'
import type { Task } from '../types'
import { Icon } from './Icons'

type TaskCardProps = {
  task: Task
  onAccept: (task: Task) => void
  onComplete: (task: Task) => void
}

export function TaskCard({ task, onAccept, onComplete }: TaskCardProps) {
  return (
    <article className={`card task ${task.status}`}>
      <div className="card-top">
        <span className="tag">{task.category}</span>
        <span className="budget">{task.budget === 0 ? 'Favour' : inr(task.budget)}</span>
      </div>

      <h3>{task.title}</h3>
      {task.description && <p className="card-desc">{task.description}</p>}

      <div className="meta">
        <span>
          <Icon name="pin" /> {task.location}
        </span>
        <span>
          <Icon name="clock" /> {task.when}
        </span>
      </div>

      <div className="card-foot">
        <div className="people">
          {task.status === 'open' ? (
            <>
              <span className="avatar">{initials(task.postedBy)}</span>
              <span>Posted by {task.postedBy}</span>
            </>
          ) : (
            <>
              <span className="avatar helper">{initials(task.helper ?? '?')}</span>
              <span>
                {task.status === 'done' ? 'Done by' : 'Coming:'} {task.helper}
              </span>
            </>
          )}
        </div>

        {task.status === 'open' && (
          <button className="btn btn-accent btn-sm" onClick={() => onAccept(task)}>
            I'll do it <Icon name="arrow" />
          </button>
        )}
        {task.status === 'accepted' && (
          <button className="btn btn-outline btn-sm" onClick={() => onComplete(task)}>
            <Icon name="check" /> Mark done
          </button>
        )}
        {task.status === 'done' && (
          <span className="done-mark">
            <Icon name="check" /> Completed
          </span>
        )}
      </div>
    </article>
  )
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
