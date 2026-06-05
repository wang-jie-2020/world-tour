import type { Landmark } from '../../types/landmark'

interface LandmarkDetailDrawerProps {
  landmark: Landmark | null
  isWishlisted: boolean
  isVisited: boolean
  onToggleWishlist: () => void
  onToggleVisited: () => void
}

export function LandmarkDetailDrawer({
  landmark,
  isWishlisted,
  isVisited,
  onToggleWishlist,
  onToggleVisited
}: LandmarkDetailDrawerProps) {
  if (!landmark) {
    return <aside>点击地标查看详情</aside>
  }

  return (
    <aside>
      <h2>{landmark.nameCn}</h2>
      <p>{landmark.nameEn}</p>
      <p>{landmark.shortIntro}</p>
      <p>{landmark.historyStory}</p>
      <p>{landmark.travelTips}</p>
      <button type="button" onClick={onToggleWishlist}>
        {isWishlisted ? '取消收藏' : '收藏想去'}
      </button>
      <button type="button" onClick={onToggleVisited}>
        {isVisited ? '取消去过' : '标记去过'}
      </button>
    </aside>
  )
}
