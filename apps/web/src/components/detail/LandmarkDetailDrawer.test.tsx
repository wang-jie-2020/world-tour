import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { landmarksSeed } from '../../data/landmarks.seed'
import { LandmarkDetailDrawer } from './LandmarkDetailDrawer'

describe('LandmarkDetailDrawer', () => {
  it('shows selected landmark info and action callbacks', async () => {
    const user = userEvent.setup()
    const onWishToggle = vi.fn()
    const onVisitedToggle = vi.fn()

    render(
      <LandmarkDetailDrawer
        landmark={landmarksSeed[0]}
        isWishlisted={false}
        isVisited={false}
        onToggleWishlist={onWishToggle}
        onToggleVisited={onVisitedToggle}
      />
    )

    expect(screen.getByRole('heading', { name: landmarksSeed[0].nameCn })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '收藏想去' }))
    await user.click(screen.getByRole('button', { name: '标记去过' }))

    expect(onWishToggle).toHaveBeenCalledTimes(1)
    expect(onVisitedToggle).toHaveBeenCalledTimes(1)
  })
})
