import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { LandmarkDetailDrawer } from './components/detail/LandmarkDetailDrawer'
import { GlobeScene } from './components/globe/GlobeScene'
import { LandmarkList } from './components/list/LandmarkList'
import { RecommendationPanel } from './components/recommendation/RecommendationPanel'
import { CategoryFilter } from './components/search/CategoryFilter'
import { SearchBar } from './components/search/SearchBar'
import { EmptyState } from './components/states/EmptyState'
import { ErrorState } from './components/states/ErrorState'
import { LoadingState } from './components/states/LoadingState'
import { filterLandmarks } from './lib/filter-landmarks'
import { buildRecommendations } from './lib/recommend'
import { landmarkService, type LandmarkService } from './services/landmarkService'
import { loadUserActions, saveUserActions } from './services/userActionStorage'
import { ExploreProvider, useExplore } from './state/explore-state'
import type { Landmark } from './types/landmark'

interface AppProps {
  service?: LandmarkService
}

function ExploreScreen({ service }: { service: LandmarkService }) {
  const { state, dispatch } = useExplore()
  const [allLandmarks, setAllLandmarks] = useState<Landmark[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hasHydratedUserActions, setHasHydratedUserActions] = useState(false)

  const loadLandmarks = async () => {
    try {
      setLoadState('loading')
      const items = await service.list()
      setAllLandmarks(items)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  useEffect(() => {
    void loadLandmarks()
  }, [])

  useEffect(() => {
    dispatch({ type: 'HYDRATE_USER_ACTIONS', payload: loadUserActions() })
    setHasHydratedUserActions(true)
  }, [dispatch])

  useEffect(() => {
    if (!hasHydratedUserActions) {
      return
    }

    saveUserActions({
      wishlistIds: state.wishlistIds,
      visitedIds: state.visitedIds
    })
  }, [hasHydratedUserActions, state.wishlistIds, state.visitedIds])

  const visibleLandmarks = useMemo(
    () =>
      filterLandmarks(allLandmarks, {
        query: state.query,
        selectedCategories: state.selectedCategories
      }),
    [allLandmarks, state.query, state.selectedCategories]
  )

  const selectedLandmark = visibleLandmarks.find((item) => item.id === state.selectedLandmarkId) ?? null

  const recommendations = buildRecommendations({
    landmarks: allLandmarks,
    selectedCategories: state.selectedCategories,
    wishlistIds: state.wishlistIds,
    visitedIds: state.visitedIds,
    selectedLandmarkId: state.selectedLandmarkId,
    limit: 4
  })

  if (loadState === 'loading') {
    return <LoadingState />
  }

  if (loadState === 'error') {
    return <ErrorState onRetry={() => void loadLandmarks()} />
  }

  return (
    <main className="app-shell">
      <header>
        <h1>Dream Globe</h1>
        <p>探索世界地标</p>
        <SearchBar
          value={state.query}
          onChange={(value) => dispatch({ type: 'SET_QUERY', payload: value })}
        />
      </header>

      <section>
        <CategoryFilter
          selected={state.selectedCategories}
          onToggle={(value) => dispatch({ type: 'TOGGLE_CATEGORY', payload: value })}
        />
      </section>

      <section style={{ height: '52vh' }}>
        <GlobeScene
          landmarks={visibleLandmarks}
          selectedId={state.selectedLandmarkId}
          onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
        />
      </section>

      {visibleLandmarks.length === 0 ? (
        <EmptyState />
      ) : (
        <LandmarkList
          landmarks={visibleLandmarks}
          selectedId={state.selectedLandmarkId}
          onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
        />
      )}

      <LandmarkDetailDrawer
        landmark={selectedLandmark}
        isWishlisted={selectedLandmark ? state.wishlistIds.includes(selectedLandmark.id) : false}
        isVisited={selectedLandmark ? state.visitedIds.includes(selectedLandmark.id) : false}
        onToggleWishlist={() =>
          selectedLandmark && dispatch({ type: 'TOGGLE_WISHLIST', payload: selectedLandmark.id })
        }
        onToggleVisited={() =>
          selectedLandmark && dispatch({ type: 'TOGGLE_VISITED', payload: selectedLandmark.id })
        }
      />

      <RecommendationPanel
        landmarks={recommendations}
        onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
      />
    </main>
  )
}

export default function App({ service = landmarkService }: AppProps) {
  return (
    <ExploreProvider>
      <ExploreScreen service={service} />
    </ExploreProvider>
  )
}
