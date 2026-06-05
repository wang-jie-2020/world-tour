import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren
} from 'react'
import type { LandmarkCategory } from '../types/landmark'

export interface ExploreState {
  query: string
  selectedCategories: LandmarkCategory[]
  selectedLandmarkId: string | null
  wishlistIds: string[]
  visitedIds: string[]
}

export const initialExploreState: ExploreState = {
  query: '',
  selectedCategories: [],
  selectedLandmarkId: null,
  wishlistIds: [],
  visitedIds: []
}

export type ExploreAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'TOGGLE_CATEGORY'; payload: LandmarkCategory }
  | { type: 'SELECT_LANDMARK'; payload: string | null }
  | { type: 'TOGGLE_WISHLIST'; payload: string }
  | { type: 'TOGGLE_VISITED'; payload: string }
  | { type: 'HYDRATE_USER_ACTIONS'; payload: { wishlistIds: string[]; visitedIds: string[] } }

const toggleId = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]

export const exploreReducer = (state: ExploreState, action: ExploreAction): ExploreState => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload }
    case 'TOGGLE_CATEGORY':
      return {
        ...state,
        selectedCategories: state.selectedCategories.includes(action.payload)
          ? state.selectedCategories.filter((item) => item !== action.payload)
          : [...state.selectedCategories, action.payload]
      }
    case 'SELECT_LANDMARK':
      return { ...state, selectedLandmarkId: action.payload }
    case 'TOGGLE_WISHLIST':
      return { ...state, wishlistIds: toggleId(state.wishlistIds, action.payload) }
    case 'TOGGLE_VISITED':
      return { ...state, visitedIds: toggleId(state.visitedIds, action.payload) }
    case 'HYDRATE_USER_ACTIONS':
      return {
        ...state,
        wishlistIds: action.payload.wishlistIds,
        visitedIds: action.payload.visitedIds
      }
    default:
      return state
  }
}

interface ExploreContextValue {
  state: ExploreState
  dispatch: Dispatch<ExploreAction>
}

const ExploreContext = createContext<ExploreContextValue | null>(null)

export function ExploreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(exploreReducer, initialExploreState)
  const value = useMemo(() => ({ state, dispatch }), [state])

  return <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>
}

export function useExplore() {
  const context = useContext(ExploreContext)
  if (!context) {
    throw new Error('useExplore must be used inside ExploreProvider')
  }

  return context
}
