import type { Landmark } from '../../types/landmark'

interface LandmarkListProps {
  landmarks: Landmark[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function LandmarkList({ landmarks, selectedId, onSelect }: LandmarkListProps) {
  return (
    <ul>
      {landmarks.map((landmark) => (
        <li key={landmark.id}>
          <button
            type="button"
            aria-pressed={selectedId === landmark.id}
            onClick={() => onSelect(landmark.id)}
          >
            {landmark.nameEn}
          </button>
        </li>
      ))}
    </ul>
  )
}
