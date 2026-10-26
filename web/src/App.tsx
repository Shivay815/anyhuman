import { useCallback, useEffect, useMemo, useState } from 'react'
import { completeTask, fetchStats, fetchTasks } from './api'
import { AcceptDialog } from './components/AcceptDialog'
import { Icon } from './components/Icons'
import { PostTaskDialog } from './components/PostTaskDialog'
import { TaskCard } from './components/TaskCard'
import { CATEGORIES, type Stats, type Task } from './types'

type StatusFilter = 'all' | 'open' | 'matched'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats>({ open: 0, matched: 0, done: 0, helpers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [postOpen, setPostOpen] = useState(false)
  const [accepting, setAccepting] = useState<Task | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const notify = useCallback((message: string) => setToast(message), [])

  const refresh = useCallback(async () => {
    try {
      const [nextTasks, nextStats] = await Promise.all([fetchTasks(), fetchStats()])
      setTasks(nextTasks)
      setStats(nextStats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the API.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (category !== 'All' && task.category !== category) return false
      if (status === 'open' && task.status !== 'open') return false
      if (status === 'matched' && task.status === 'open') return false
      if (!needle) return true
      return [task.title, task.description, task.category, task.location, task.postedBy, task.helper ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [tasks, category, status, query])

  const openCount = tasks.filter((task) => task.status === 'open').length
  const matchedCount = tasks.length - openCount

  function handleCreated(task: Task) {
    setTasks((current) => [task, ...current])
    setPostOpen(false)
    setStatus('all')
    notify('Posted. Now we wait for a human to say yes.')
    void refresh()
  }

  function handleAccepted(task: Task) {
    setTasks((current) => current.map((item) => (item.id === task.id ? task : item)))
    setAccepting(null)
    notify(`You're on. ${task.postedBy} will see that you accepted.`)
    void refresh()
  }

  async function handleComplete(task: Task) {
    try {
      const updated = await completeTask(task.id)
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)))
      notify('Marked as done. Good work.')
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not complete that task.')
    }
  }

  return (
    <div className="page">
      <header className="site-header">
        <a className="brand" href="#top">
          anyhuman<span>.</span>
        </a>
        <nav className="nav">
          <a href="#browse">Browse</a>
          <a href="#how">How it works</a>
        </nav>
        <button className="btn btn-ink btn-sm" onClick={() => setPostOpen(true)}>
          <Icon name="plus" /> Post a task
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">
            <span className="dot" /> A marketplace for anything a human can do
          </p>
          <h1>
            Need a human?
            <br />
            <em>Any human. Any task.</em>
          </h1>
          <p className="lede">
            Fix a tap. Teach a chord. Assemble a desk. Or just sit with someone who shouldn't be alone.
            Describe it, name your budget, and a real person will say yes.
          </p>
          <div className="hero-actions">
            <button className="btn btn-accent" onClick={() => setPostOpen(true)}>
              Post a task <Icon name="arrow" />
            </button>
            <a className="btn btn-outline" href="#browse">
              Browse open tasks
            </a>
          </div>
          <div className="search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search: leaky tap, haircut, someone to talk to…"
              aria-label="Search tasks"
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <Icon name="close" />
              </button>
            )}
          </div>
        </section>

        <section className="stats" aria-label="Marketplace stats">
          <Stat value={stats.open} label="open requests" />
          <Stat value={stats.matched} label="matches made" />
          <Stat value={stats.done} label="jobs done" />
          <Stat value={stats.helpers} label="humans helping" />
        </section>

        <section className="browse" id="browse">
          <div className="section-head">
            <div>
              <h2>Open around you</h2>
              <p>Real requests from real people. Take one if it's yours to take.</p>
            </div>
            <div className="tabs" role="group" aria-label="Filter by status">
              <button className={status === 'all' ? 'tab active' : 'tab'} onClick={() => setStatus('all')}>
                All <span>{tasks.length}</span>
              </button>
              <button className={status === 'open' ? 'tab active' : 'tab'} onClick={() => setStatus('open')}>
                Open <span>{openCount}</span>
              </button>
              <button
                className={status === 'matched' ? 'tab active' : 'tab'}
                onClick={() => setStatus('matched')}
              >
                Matched <span>{matchedCount}</span>
              </button>
            </div>
          </div>

          <div className="chips">
            {['All', ...CATEGORIES].map((item) => (
              <button
                key={item}
                className={category === item ? 'chip active' : 'chip'}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button className="btn btn-outline btn-sm" onClick={() => void refresh()}>
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid">
              {[0, 1, 2].map((item) => (
                <div className="card skeleton" key={item}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : visibleTasks.length ? (
            <div className="grid">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAccept={setAccepting}
                  onComplete={(item) => void handleComplete(item)}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>Nothing here yet.</h3>
              <p>No tasks match that filter. Try another category, or post the thing you actually need.</p>
              <button className="btn btn-ink" onClick={() => setPostOpen(true)}>
                Post a task
              </button>
            </div>
          )}
        </section>

        <section className="how" id="how">
          <div className="how-inner">
            <p className="eyebrow light">
              <span className="dot" /> How it works
            </p>
            <h2>
              Three steps. <em>No middlemen.</em>
            </h2>
            <div className="steps">
              <Step
                index="01"
                title="Say what you need"
                body="A tap that drips. A haircut before a wedding. Two hours of company. Set your budget, place and time — the task can be as ordinary or as odd as you like."
              />
              <Step
                index="02"
                title="A human says yes"
                body="Helpers browse open tasks and accept the ones they can actually do. You see who is coming and why they're a fit before anything is confirmed."
              />
              <Step
                index="03"
                title="Meet. Done. Pay."
                body="No agencies, no memberships, no commission. Settle directly with the person who showed up. Then mark the task done and leave the rest to good manners."
              />
            </div>
            <div className="how-cta">
              <p>Got an hour and a useful pair of hands?</p>
              <a className="btn btn-accent" href="#browse">
                Find something to do <Icon name="arrow" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="brand">
          anyhuman<span>.</span>
        </div>
        <p>A human for anything. Built for the home server.</p>
        <a href="https://github.com/Shivay815/anyhuman" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>

      <PostTaskDialog open={postOpen} onClose={() => setPostOpen(false)} onCreated={handleCreated} />
      <AcceptDialog task={accepting} onClose={() => setAccepting(null)} onAccepted={handleAccepted} />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Step({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <article className="step">
      <span className="step-index">{index}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}
