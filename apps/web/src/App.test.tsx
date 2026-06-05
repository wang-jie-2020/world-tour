import { render, screen } from '@testing-library/react'
import App from './App'
import type { LandmarkService } from './services/landmarkService'

const createResolvedService = (): LandmarkService => ({
  list: async () => [
    {
      id: 'test-landmark',
      nameCn: '测试地标',
      nameEn: 'Test Landmark',
      country: 'Test Country',
      city: 'Test City',
      continent: 'Asia',
      lat: 0,
      lng: 0,
      categories: ['popular_destination'],
      coverImage: '/images/test.jpg',
      gallery: ['/images/test.jpg'],
      shortIntro: 'intro',
      historyStory: 'history',
      travelTips: 'tips',
      funFacts: ['fact'],
      popularityScore: 80
    }
  ],
  getById: async () => null
})

describe('App shell', () => {
  it('renders product heading and subtitle', async () => {
    render(<App service={createResolvedService()} />)

    expect(await screen.findByRole('heading', { name: 'Dream Globe' })).toBeInTheDocument()
    expect(screen.getByText('探索世界地标')).toBeInTheDocument()
  })
})
