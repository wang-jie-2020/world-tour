import type { Landmark, LandmarkCategory } from '../types/landmark'

interface RecommendInput {
  landmarks: Landmark[]
  selectedCategories: LandmarkCategory[]
  wishlistIds: string[]
  visitedIds: string[]
  selectedLandmarkId: string | null
  limit: number
}

export function buildRecommendations(input: RecommendInput): Landmark[] {
  const preferredCategorySet = new Set<LandmarkCategory>(input.selectedCategories)

  for (const landmark of input.landmarks) {
    if (input.wishlistIds.includes(landmark.id) || input.visitedIds.includes(landmark.id)) {
      landmark.categories.forEach((category) => preferredCategorySet.add(category))
    }
  }

  return input.landmarks
    .filter((item) => !input.visitedIds.includes(item.id))
    .filter((item) => item.id !== input.selectedLandmarkId)
    .map((item) => {
      const categoryScore = item.categories.reduce(
        (sum, category) => sum + (preferredCategorySet.has(category) ? 3 : 0),
        0
      )
      const popularityScore = item.popularityScore / 100
      return {
        item,
        score: categoryScore + popularityScore
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit)
    .map((entry) => entry.item)
}
