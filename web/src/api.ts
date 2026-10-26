import type { NewTask, Stats, Task } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export function fetchTasks() {
  return request<Task[]>('/api/tasks')
}

export function fetchStats() {
  return request<Stats>('/api/stats')
}

export function createTask(payload: NewTask) {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function acceptTask(id: string, payload: { helper: string; note: string }) {
  return request<Task>(`/api/tasks/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function completeTask(id: string) {
  return request<Task>(`/api/tasks/${id}/complete`, {
    method: 'POST',
  })
}
