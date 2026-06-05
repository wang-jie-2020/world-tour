import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { LandmarkService } from './services/landmarkService'

const createRejectingService = (): LandmarkService => ({
  list: async () => {
    throw new Error('network failure')
  },
  getById: async () => null
})

const createResolvedService = (): LandmarkService => ({
  list: async () => [
    {
      id: 'eiffel-tower',
      nameCn: '埃菲尔铁塔',
      nameEn: 'Eiffel Tower',
      country: 'France',
      city: 'Paris',
      continent: 'Europe',
      lat: 48.8584,
      lng: 2.2945,
      categories: ['city_architecture', 'popular_destination'],
      coverImage: '/images/eiffel.jpg',
      gallery: ['/images/eiffel.jpg'],
      shortIntro: '巴黎地标性铁塔，城市天际线象征。',
      historyStory: '1889 年世博会为纪念法国大革命百年而建。',
      travelTips: '建议傍晚登塔，提前预约门票。',
      funFacts: ['铁塔每晚整点闪烁灯光。'],
      popularityScore: 98
    }
  ],
  getById: async () => null
})

describe('App loading states', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows retry UI when list request fails', async () => {
    const user = userEvent.setup()
    render(<App service={createRejectingService()} />)

    await waitFor(() => {
      expect(screen.getByText('地标加载失败')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(screen.getByText('地标加载失败')).toBeInTheDocument()
  })

  it('restores wishlist after remount', async () => {
    const service = createResolvedService()
    const firstUser = userEvent.setup()
    const firstRender = render(<App service={service} />)

    await firstUser.click(await screen.findByRole('button', { name: 'Eiffel Tower' }))
    await firstUser.click(screen.getByRole('button', { name: '收藏想去' }))
    await screen.findByRole('button', { name: '取消收藏' })

    firstRender.unmount()

    const secondUser = userEvent.setup()
    render(<App service={service} />)

    await secondUser.click(await screen.findByRole('button', { name: 'Eiffel Tower' }))
    await expect(screen.findByRole('button', { name: '取消收藏' })).resolves.toBeInTheDocument()
  })
})
