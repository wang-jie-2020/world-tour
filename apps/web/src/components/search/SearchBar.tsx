interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      aria-label="搜索地标"
      placeholder="搜索国家/城市/地标"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
