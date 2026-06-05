import { landmarksSeed } from '../data/landmarks.seed'
import type { Landmark, LandmarkQuery } from '../types/landmark'

export interface LandmarkService {
  list(query?: LandmarkQuery): Promise<Landmark[]>
  getById(id: string): Promise<Landmark | null>
}

const includesText = (item: Landmark, query: string): boolean => {
  const q = query.toLowerCase()
  return [item.nameCn, item.nameEn, item.country, item.city].some((value) =>
    value.toLowerCase().includes(q)
  )
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createLandmarkService = (seed: Landmark[]): LandmarkService => ({
  async list(query) {
    await delay(80)
    return seed.filter((item) => {
      const byQuery = query?.query ? includesText(item, query.query) : true
      const byCategory =
        query?.categories && query.categories.length > 0
          ? query.categories.some((category) => item.categories.includes(category))
          : true

      return byQuery && byCategory
    })
  },

  async getById(id) {
    await delay(20)
    return seed.find((item) => item.id === id) ?? null
  }
})

export const landmarkService = createLandmarkService(landmarksSeed)
