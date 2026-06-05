import type { Landmark } from '../../types/landmark'

interface RecommendationPanelProps {
  landmarks: Landmark[]
  onSelect: (id: string) => void
}

export function RecommendationPanel({ landmarks, onSelect }: RecommendationPanelProps) {
  return (
    <section>
      <h3>为你推荐</h3>
      <ul>
        {landmarks.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onSelect(item.id)}>
              {item.nameCn} · {item.country}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
