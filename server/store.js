import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || join(__dirname, '..', 'data')
const dbPath = join(dataDir, 'db.json')
const seedPath = join(__dirname, 'seed.json')

let cache = null

function persist(next) {
  mkdirSync(dataDir, { recursive: true })
  const tmp = `${dbPath}.tmp`
  writeFileSync(tmp, JSON.stringify(next, null, 2))
  renameSync(tmp, dbPath)
}

function load() {
  if (cache) return cache
  if (existsSync(dbPath)) {
    try {
      cache = JSON.parse(readFileSync(dbPath, 'utf8'))
      return cache
    } catch (error) {
      console.error('Database is unreadable, reseeding from seed.json.', error)
    }
  }
  cache = JSON.parse(readFileSync(seedPath, 'utf8'))
  persist(cache)
  return cache
}

export function listTasks({ status, category, q } = {}) {
  let tasks = [...load()]

  if (status === 'matched') tasks = tasks.filter((task) => task.status !== 'open')
  else if (status && status !== 'all') tasks = tasks.filter((task) => task.status === status)

  if (category && category !== 'All') tasks = tasks.filter((task) => task.category === category)

  if (q) {
    const needle = q.toLowerCase()
    tasks = tasks.filter((task) =>
      [task.title, task.description, task.category, task.location, task.postedBy, task.helper ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }

  return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function createTask(input) {
  const tasks = load()
  const task = {
    id: randomUUID(),
    ...input,
    status: 'open',
    helper: null,
    helperNote: '',
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null,
  }
  tasks.push(task)
  persist(tasks)
  return task
}

export function acceptTask(id, { helper, note }) {
  const tasks = load()
  const task = tasks.find((item) => item.id === id)
  if (!task) return { error: 'not_found' }
  if (task.status !== 'open') return { error: 'not_open' }

  task.status = 'accepted'
  task.helper = helper
  task.helperNote = note || ''
  task.acceptedAt = new Date().toISOString()
  persist(tasks)
  return { task }
}

export function completeTask(id) {
  const tasks = load()
  const task = tasks.find((item) => item.id === id)
  if (!task) return { error: 'not_found' }
  if (task.status !== 'accepted') return { error: 'not_accepted' }

  task.status = 'done'
  task.completedAt = new Date().toISOString()
  persist(tasks)
  return { task }
}

export function getStats() {
  const tasks = load()
  const open = tasks.filter((task) => task.status === 'open').length
  const done = tasks.filter((task) => task.status === 'done').length
  const helpers = new Set(tasks.map((task) => task.helper).filter(Boolean)).size
  return { open, matched: tasks.length - open, done, helpers }
}
