import type { LandmarkCategory } from '../../types/landmark'

const options: Array<{ label: string; value: LandmarkCategory }> = [
  { label: '自然奇观', value: 'natural_wonder' },
  { label: '历史遗迹', value: 'historical_site' },
  { label: '城市建筑', value: 'city_architecture' },
  { label: '宗教建筑', value: 'religious_site' },
  { label: '世界遗产', value: 'world_heritage' },
  { label: '热门旅行地', value: 'popular_destination' }
]

interface CategoryFilterProps {
  selected: LandmarkCategory[]
  onToggle: (value: LandmarkCategory) => void
}

export function CategoryFilter({ selected, onToggle }: CategoryFilterProps) {
  return (
    <div>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected.includes(option.value)}
          onClick={() => onToggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
