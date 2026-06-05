import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { Landmark } from '../../types/landmark'
import { LandmarkHotspots } from './LandmarkHotspots'

interface GlobeSceneProps {
  landmarks: Landmark[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function GlobeScene({ landmarks, selectedId, onSelect }: GlobeSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 2, 5]} intensity={1.1} />
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#73b8ff" roughness={0.65} metalness={0.1} />
      </mesh>
      <LandmarkHotspots landmarks={landmarks} selectedId={selectedId} onSelect={onSelect} />
      <OrbitControls enablePan={false} minDistance={1.8} maxDistance={5.2} />
    </Canvas>
  )
}
