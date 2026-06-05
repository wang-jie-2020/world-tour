import { createLandmarkService } from './landmarkService'
import { landmarksSeed } from '../data/landmarks.seed'

describe('landmarkService', () => {
  const service = createLandmarkService(landmarksSeed)

  it('lists all landmarks by default', async () => {
    const result = await service.list()
    expect(result.length).toBe(landmarksSeed.length)
  })

  it('filters by category and search text', async () => {
    const result = await service.list({
      query: 'tower',
      categories: ['city_architecture']
    })

    expect(result.map((item) => item.id)).toEqual(['eiffel-tower'])
  })

  it('returns single landmark by id', async () => {
    const item = await service.getById('machu-picchu')
    expect(item?.nameCn).toBe('马丘比丘')
  })
})
