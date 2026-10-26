import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { acceptTask, completeTask, createTask, getStats, listTasks } from './store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'web', 'dist')
const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

const text = (value) => (typeof value === 'string' ? value.trim() : '')

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

app.get('/api/tasks', (req, res) => {
  const { status, category, q } = req.query
  res.json(
    listTasks({
      status: typeof status === 'string' ? status : undefined,
      category: typeof category === 'string' ? category : undefined,
      q: typeof q === 'string' ? q : undefined,
    }),
  )
})

app.post('/api/tasks', (req, res) => {
  const body = req.body ?? {}
  const title = text(body.title)
  const description = text(body.description)
  const category = text(body.category) || 'Something else'
  const location = text(body.location)
  const when = text(body.when)
  const postedBy = text(body.postedBy)
  const budget = Number(body.budget)

  if (title.length < 3 || title.length > 120) {
    return res.status(400).json({ error: 'Title must be between 3 and 120 characters.' })
  }
  if (description.length > 1000) {
    return res.status(400).json({ error: 'Description must be under 1000 characters.' })
  }
  if (category.length > 40) {
    return res.status(400).json({ error: 'Category is too long.' })
  }
  if (!location || location.length > 120) {
    return res.status(400).json({ error: 'Add a place (up to 120 characters).' })
  }
  if (!when || when.length > 80) {
    return res.status(400).json({ error: 'Add a time (up to 80 characters).' })
  }
  if (!postedBy || postedBy.length > 60) {
    return res.status(400).json({ error: 'Add your name (up to 60 characters).' })
  }
  if (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000) {
    return res.status(400).json({ error: 'Budget must be a number between 0 and 1,000,000.' })
  }

  const task = createTask({
    title,
    description,
    category,
    budget: Math.round(budget),
    location,
    when,
    postedBy,
  })
  res.status(201).json(task)
})

app.post('/api/tasks/:id/accept', (req, res) => {
  const helper = text(req.body?.helper)
  const note = text(req.body?.note)

  if (helper.length < 2 || helper.length > 60) {
    return res.status(400).json({ error: 'Add your name (2-60 characters).' })
  }
  if (note.length > 280) {
    return res.status(400).json({ error: 'Keep the note under 280 characters.' })
  }

  const result = acceptTask(req.params.id, { helper, note })
  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'That task no longer exists.' })
  }
  if (result.error === 'not_open') {
    return res.status(409).json({ error: 'Someone else got there first. This task is already taken.' })
  }
  res.json(result.task)
})

app.post('/api/tasks/:id/complete', (req, res) => {
  const result = completeTask(req.params.id)
  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'That task no longer exists.' })
  }
  if (result.error === 'not_accepted') {
    return res.status(409).json({ error: 'Only accepted tasks can be completed.' })
  }
  res.json(result.task)
})

app.get('/api/stats', (_req, res) => {
  res.json(getStats())
})

const hasBuild = existsSync(join(distDir, 'index.html'))

if (hasBuild) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
    res.sendFile(join(distDir, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
} else {
  app.get('/', (_req, res) => {
    res
      .type('text/plain')
      .send('anyhuman API is running. Build the frontend with `npm run build`, then reload.')
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on our side.' })
})

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
  console.log(`anyhuman listening on http://localhost:${port}`)
})
