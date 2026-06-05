import { landmarksSeed } from '../data/landmarks.seed'
import { filterLandmarks } from './filter-landmarks'

describe('filterLandmarks', () => {
  it('returns query-matching landmarks case-insensitively', () => {
    const result = filterLandmarks(landmarksSeed, {
      query: 'wall',
      selectedCategories: []
    })

    expect(result.map((item) => item.id)).toEqual(['great-wall'])
  })

  it('returns landmarks that match at least one selected category', () => {
    const result = filterLandmarks(landmarksSeed, {
      query: '',
      selectedCategories: ['natural_wonder']
    })

    expect(result.every((item) => item.categories.includes('natural_wonder'))).toBe(true)
  })

  it('applies query and category together', () => {
    const result = filterLandmarks(landmarksSeed, {
      query: 'sydney',
      selectedCategories: ['city_architecture']
    })

    expect(result.map((item) => item.id)).toEqual(['sydney-opera-house'])
  })
})
