import { create } from 'zustand'

const storageKey = 'emr_auth'

export type Role = 'patient' | 'doctor'

export interface AuthUser {
  id: number
  username: string
  role: Role
  name: string
  patientId?: string | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const loadInitialState = (): Pick<AuthState, 'token' | 'user'> => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { token: null, user: null }
    const parsed = JSON.parse(raw) as Partial<AuthState>
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { token: null, user: null }
  }
}

const saveState = (state: Pick<AuthState, 'token' | 'user'>) => {
  const payload = {
    token: state.token,
    user: state.user,
  }
  localStorage.setItem(storageKey, JSON.stringify(payload))
}

const useAuthStore = create<AuthState>((set) => ({
  ...loadInitialState(),
  login: (token, user) =>
    set((prev) => {
      const next = { ...prev, token, user }
      saveState(next)
      return next
    }),
  logout: () =>
    set((prev) => {
      const next = { token: null, user: null } as Pick<AuthState, 'token' | 'user'>
      saveState(next)
      return { ...prev, ...next }
    }),
}))

export default useAuthStore
