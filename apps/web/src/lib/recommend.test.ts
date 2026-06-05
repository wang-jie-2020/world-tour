import { landmarksSeed } from '../data/landmarks.seed'
import { buildRecommendations } from './recommend'

describe('buildRecommendations', () => {
  it('boosts categories related to wishlist/visited history', () => {
    const result = buildRecommendations({
      landmarks: landmarksSeed,
      selectedCategories: [],
      wishlistIds: ['eiffel-tower'],
      visitedIds: [],
      selectedLandmarkId: null,
      limit: 3
    })

    expect(result[0].categories.includes('city_architecture')).toBe(true)
  })

  it('excludes currently selected and visited landmarks', () => {
    const result = buildRecommendations({
      landmarks: landmarksSeed,
      selectedCategories: ['historical_site'],
      wishlistIds: [],
      visitedIds: ['great-wall'],
      selectedLandmarkId: 'machu-picchu',
      limit: 10
    })

    const ids = result.map((item) => item.id)
    expect(ids).not.toContain('great-wall')
    expect(ids).not.toContain('machu-picchu')
  })
})
