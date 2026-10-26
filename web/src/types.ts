export const CATEGORIES = [
  'Home repair',
  'Salon & grooming',
  'Spa & massage',
  'Cleaning',
  'Tech help',
  'Tutoring',
  'Errands',
  'Just company',
  'Something else',
] as const

export type TaskStatus = 'open' | 'accepted' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  category: string
  budget: number
  location: string
  when: string
  status: TaskStatus
  postedBy: string
  helper: string | null
  helperNote?: string
  createdAt: string
  acceptedAt?: string | null
  completedAt?: string | null
}

export interface Stats {
  open: number
  matched: number
  done: number
  helpers: number
}

export interface NewTask {
  title: string
  description: string
  category: string
  budget: number
  location: string
  when: string
  postedBy: string
}
