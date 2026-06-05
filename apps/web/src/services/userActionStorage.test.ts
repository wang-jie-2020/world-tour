import { loadUserActions, saveUserActions } from './userActionStorage'

describe('userActionStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty defaults when localStorage is empty', () => {
    expect(loadUserActions()).toEqual({ wishlistIds: [], visitedIds: [] })
  })

  it('saves and loads user actions', () => {
    saveUserActions({ wishlistIds: ['eiffel-tower'], visitedIds: ['great-wall'] })

    expect(loadUserActions()).toEqual({
      wishlistIds: ['eiffel-tower'],
      visitedIds: ['great-wall']
    })
  })
})
