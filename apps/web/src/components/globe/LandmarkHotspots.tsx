import { Html } from '@react-three/drei'
import { latLngToCartesian } from '../../lib/geo'
import type { Landmark } from '../../types/landmark'

interface LandmarkHotspotsProps {
  landmarks: Landmark[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function LandmarkHotspots({ landmarks, selectedId, onSelect }: LandmarkHotspotsProps) {
  return (
    <>
      {landmarks.map((landmark) => {
        const point = latLngToCartesian(landmark.lat, landmark.lng, 1.04)

        return (
          <Html key={landmark.id} position={[point.x, point.y, point.z]}>
            <button
              type="button"
              aria-pressed={selectedId === landmark.id}
              onClick={() => onSelect(landmark.id)}
            >
              ●
            </button>
          </Html>
        )
      })}
    </>
  )
}
