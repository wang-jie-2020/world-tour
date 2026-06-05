import type { Landmark, LandmarkCategory } from '../types/landmark'

interface FilterInput {
  query: string
  selectedCategories: LandmarkCategory[]
}

export function filterLandmarks(landmarks: Landmark[], input: FilterInput): Landmark[] {
  const q = input.query.trim().toLowerCase()

  return landmarks.filter((item) => {
    const matchesQuery =
      q.length === 0
        ? true
        : [item.nameCn, item.nameEn, item.country, item.city].some((field) =>
            field.toLowerCase().includes(q)
          )

    const matchesCategory =
      input.selectedCategories.length === 0
        ? true
        : input.selectedCategories.some((category) => item.categories.includes(category))

    return matchesQuery && matchesCategory
  })
}
