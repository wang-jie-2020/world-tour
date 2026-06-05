const STORAGE_KEY = 'dream-globe.user-actions.v1'

export interface UserActionSnapshot {
  wishlistIds: string[]
  visitedIds: string[]
}

export function loadUserActions(): UserActionSnapshot {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { wishlistIds: [], visitedIds: [] }
  }

  try {
    const parsed = JSON.parse(raw) as UserActionSnapshot
    return {
      wishlistIds: parsed.wishlistIds ?? [],
      visitedIds: parsed.visitedIds ?? []
    }
  } catch {
    return { wishlistIds: [], visitedIds: [] }
  }
}

export function saveUserActions(snapshot: UserActionSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}
