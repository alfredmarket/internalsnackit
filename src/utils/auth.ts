import { type User } from 'firebase/auth'

export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) return false
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  if (!raw) return false
  const admins = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return admins.includes(user.email.toLowerCase())
}
