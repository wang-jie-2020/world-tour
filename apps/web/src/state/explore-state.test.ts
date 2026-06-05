import { exploreReducer, initialExploreState } from './explore-state'

describe('exploreReducer', () => {
  it('sets search query', () => {
    const next = exploreReducer(initialExploreState, {
      type: 'SET_QUERY',
      payload: 'Paris'
    })

    expect(next.query).toBe('Paris')
  })

  it('toggles category membership', () => {
    const withCategory = exploreReducer(initialExploreState, {
      type: 'TOGGLE_CATEGORY',
      payload: 'world_heritage'
    })

    expect(withCategory.selectedCategories).toEqual(['world_heritage'])

    const withoutCategory = exploreReducer(withCategory, {
      type: 'TOGGLE_CATEGORY',
      payload: 'world_heritage'
    })

    expect(withoutCategory.selectedCategories).toEqual([])
  })

  it('tracks selected landmark', () => {
    const next = exploreReducer(initialExploreState, {
      type: 'SELECT_LANDMARK',
      payload: 'great-wall'
    })

    expect(next.selectedLandmarkId).toBe('great-wall')
  })
})
