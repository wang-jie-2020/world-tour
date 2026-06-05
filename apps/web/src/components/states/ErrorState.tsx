interface ErrorStateProps {
  onRetry: () => void
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <section>
      <p>地标加载失败</p>
      <button type="button" onClick={onRetry}>
        重试
      </button>
    </section>
  )
}
