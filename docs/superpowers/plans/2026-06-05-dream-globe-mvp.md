# Dream Globe MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP web app where users explore global landmarks on an interactive 3D globe, open landmark details, search/filter content, and save 想去/去过 states with lightweight recommendations.

**Architecture:** Build a frontend-first SPA in `apps/web` with strict module boundaries: `types + data + services` for content, `state` for interaction state, `components` for UI, and `lib` for pure business logic (filtering, recommendation, geo conversion). Start with local seed data wrapped behind a service interface, so switching to real backend APIs later only changes service implementations.

**Tech Stack:** TypeScript, React 18, Vite, Three.js, @react-three/fiber, @react-three/drei, Vitest + Testing Library, Playwright.

---

## Scope Check
The approved spec is a single MVP subsystem (one app with tightly-related modules), so one integrated plan is appropriate; no sub-project split is required.

## Milestones & Validation Checkpoints

| Milestone | Tasks | Validation checkpoint |
|---|---|---|
| M1 Foundation | Task 1-3 | `npm run test` passes; app shell + state actions working |
| M2 Exploration Core | Task 4-6 | Globe clickable; detail + search + category flow complete |
| M3 Personalization | Task 7-8 | 收藏/打卡 persistence works; recommendations visible |
| M4 Hardening | Task 9-10 | loading/error/empty states + e2e + build all pass |

## Dependencies

- Task 1 blocks all later tasks.
- Task 2 blocks Tasks 4/5/6/8/9.
- Task 3 blocks Tasks 5/6/7/8/9.
- Task 4 blocks Task 5.
- Task 6 and Task 7 both block Task 8.
- Task 9 should complete before Task 10 final validation and release check.

## File Structure Map

- Create: `apps/web/` — frontend MVP app root.
- Create: `apps/web/src/types/landmark.ts` — domain types and enums.
- Create: `apps/web/src/data/landmarks.seed.ts` — curated MVP landmark dataset.
- Create: `apps/web/src/services/landmarkService.ts` — async content repository abstraction.
- Create: `apps/web/src/services/userActionStorage.ts` — local persistence for 想去/去过.
- Create: `apps/web/src/state/explore-state.tsx` — reducer + context + hook.
- Create: `apps/web/src/lib/geo.ts` — lat/lng to 3D vector conversion.
- Create: `apps/web/src/lib/filter-landmarks.ts` — pure filtering logic.
- Create: `apps/web/src/lib/recommend.ts` — recommendation ranking logic.
- Create: `apps/web/src/components/globe/*` — 3D globe and hotspot rendering.
- Create: `apps/web/src/components/search/*` — search input and category filter.
- Create: `apps/web/src/components/detail/*` — landmark detail drawer card.
- Create: `apps/web/src/components/recommendation/*` — recommendation list.
- Create: `apps/web/src/components/states/*` — Loading/Error/Empty UI states.
- Create: `apps/web/src/components/list/LandmarkList.tsx` — accessible list (also e2e anchor).
- Create: `apps/web/tests/e2e/mvp-flow.spec.ts` — end-to-end user journey.

---

### Task 1: Bootstrap web app + test harness

**Depends on:** none  
**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Scaffold React + TypeScript app**

Run:
```bash
npm create vite@latest apps/web -- --template react-ts
```
Expected: output contains `Scaffolding project in .../apps/web` and `Done`.

- [ ] **Step 2: Install runtime and test dependencies**

Run:
```bash
cd apps/web
npm install three @react-three/fiber @react-three/drei
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom playwright
npx playwright install
```
Expected: install completes without vulnerability blocker errors.

- [ ] **Step 3: Configure scripts and Vitest environment**

`apps/web/package.json` (scripts section):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

`apps/web/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
})
```

`apps/web/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Write failing shell test**

`apps/web/src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  it('renders product heading and subtitle', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Dream Globe' })).toBeInTheDocument()
    expect(screen.getByText('探索世界地标')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the test and confirm failure**

Run:
```bash
npm run test -- src/App.test.tsx
```
Expected: FAIL because current `App.tsx` does not render required heading/subtitle.

- [ ] **Step 6: Implement minimal app shell to make test pass**

`apps/web/src/App.tsx`:
```tsx
import './App.css'

export default function App() {
  return (
    <main className="app-shell">
      <header>
        <h1>Dream Globe</h1>
        <p>探索世界地标</p>
      </header>
    </main>
  )
}
```

- [ ] **Step 7: Re-run test and commit**

Run:
```bash
npm run test -- src/App.test.tsx
```
Expected: PASS (`1 passed`).

Commit:
```bash
git add apps/web
git commit -m "chore: bootstrap web app with test harness"
```

---

### Task 2: Define landmark domain model + seed repository

**Depends on:** Task 1  
**Files:**
- Create: `apps/web/src/types/landmark.ts`
- Create: `apps/web/src/data/landmarks.seed.ts`
- Create: `apps/web/src/services/landmarkService.ts`
- Test: `apps/web/src/services/landmarkService.test.ts`

- [ ] **Step 1: Write failing repository tests**

`apps/web/src/services/landmarkService.test.ts`:
```ts
import { createLandmarkService } from './landmarkService'
import { landmarksSeed } from '../data/landmarks.seed'

describe('landmarkService', () => {
  const service = createLandmarkService(landmarksSeed)

  it('lists all landmarks by default', async () => {
    const result = await service.list()
    expect(result.length).toBe(landmarksSeed.length)
  })

  it('filters by category and search text', async () => {
    const result = await service.list({
      query: 'tower',
      categories: ['city_architecture']
    })

    expect(result.map((item) => item.id)).toEqual(['eiffel-tower'])
  })

  it('returns single landmark by id', async () => {
    const item = await service.getById('machu-picchu')
    expect(item?.nameCn).toBe('马丘比丘')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
npm run test -- src/services/landmarkService.test.ts
```
Expected: FAIL with module-not-found errors for missing type/data/service files.

- [ ] **Step 3: Implement types, seed data, and repository**

`apps/web/src/types/landmark.ts`:
```ts
export type LandmarkCategory =
  | 'natural_wonder'
  | 'historical_site'
  | 'city_architecture'
  | 'religious_site'
  | 'world_heritage'
  | 'popular_destination'

export interface Landmark {
  id: string
  nameCn: string
  nameEn: string
  country: string
  city: string
  continent: 'Asia' | 'Europe' | 'Africa' | 'North America' | 'South America' | 'Oceania'
  lat: number
  lng: number
  categories: LandmarkCategory[]
  coverImage: string
  gallery: string[]
  shortIntro: string
  historyStory: string
  travelTips: string
  funFacts: string[]
  popularityScore: number
}

export interface LandmarkQuery {
  query?: string
  categories?: LandmarkCategory[]
}
```

`apps/web/src/data/landmarks.seed.ts`:
```ts
import type { Landmark } from '../types/landmark'

export const landmarksSeed: Landmark[] = [
  {
    id: 'eiffel-tower',
    nameCn: '埃菲尔铁塔',
    nameEn: 'Eiffel Tower',
    country: 'France',
    city: 'Paris',
    continent: 'Europe',
    lat: 48.8584,
    lng: 2.2945,
    categories: ['city_architecture', 'popular_destination'],
    coverImage: '/images/eiffel.jpg',
    gallery: ['/images/eiffel.jpg'],
    shortIntro: '巴黎地标性铁塔，城市天际线象征。',
    historyStory: '1889 年世博会为纪念法国大革命百年而建。',
    travelTips: '建议傍晚登塔，提前预约门票。',
    funFacts: ['铁塔每晚整点闪烁灯光。'],
    popularityScore: 98
  },
  {
    id: 'machu-picchu',
    nameCn: '马丘比丘',
    nameEn: 'Machu Picchu',
    country: 'Peru',
    city: 'Cusco Region',
    continent: 'South America',
    lat: -13.1631,
    lng: -72.545,
    categories: ['historical_site', 'world_heritage'],
    coverImage: '/images/machu-picchu.jpg',
    gallery: ['/images/machu-picchu.jpg'],
    shortIntro: '安第斯山脉中的印加古城遗址。',
    historyStory: '15 世纪印加文明遗迹，后被世界重新发现。',
    travelTips: '高海拔地区，需提前适应并预约限流门票。',
    funFacts: ['常被称为“失落之城”。'],
    popularityScore: 93
  },
  {
    id: 'great-wall',
    nameCn: '长城',
    nameEn: 'Great Wall',
    country: 'China',
    city: 'Beijing',
    continent: 'Asia',
    lat: 40.4319,
    lng: 116.5704,
    categories: ['historical_site', 'world_heritage', 'popular_destination'],
    coverImage: '/images/great-wall.jpg',
    gallery: ['/images/great-wall.jpg'],
    shortIntro: '跨越山岭的古代防御工程。',
    historyStory: '多朝代修筑与加固，形成宏大防线。',
    travelTips: '穿防滑鞋，避开节假日高峰。',
    funFacts: ['总长度超过两万公里。'],
    popularityScore: 96
  },
  {
    id: 'taj-mahal',
    nameCn: '泰姬陵',
    nameEn: 'Taj Mahal',
    country: 'India',
    city: 'Agra',
    continent: 'Asia',
    lat: 27.1751,
    lng: 78.0421,
    categories: ['religious_site', 'world_heritage', 'historical_site'],
    coverImage: '/images/taj-mahal.jpg',
    gallery: ['/images/taj-mahal.jpg'],
    shortIntro: '白色大理石陵寝建筑杰作。',
    historyStory: '莫卧儿皇帝为纪念皇后而建。',
    travelTips: '清晨光线最佳，周五部分区域关闭。',
    funFacts: ['随光线变化呈现不同色调。'],
    popularityScore: 94
  },
  {
    id: 'serengeti',
    nameCn: '塞伦盖蒂国家公园',
    nameEn: 'Serengeti National Park',
    country: 'Tanzania',
    city: 'Serengeti',
    continent: 'Africa',
    lat: -2.3333,
    lng: 34.8333,
    categories: ['natural_wonder', 'popular_destination'],
    coverImage: '/images/serengeti.jpg',
    gallery: ['/images/serengeti.jpg'],
    shortIntro: '非洲大草原与野生动物迁徙圣地。',
    historyStory: '以年度角马迁徙闻名全球。',
    travelTips: '旱季观赏迁徙更稳定，建议跟团进入保护区。',
    funFacts: ['每年约有上百万只角马迁徙。'],
    popularityScore: 90
  },
  {
    id: 'sydney-opera-house',
    nameCn: '悉尼歌剧院',
    nameEn: 'Sydney Opera House',
    country: 'Australia',
    city: 'Sydney',
    continent: 'Oceania',
    lat: -33.8568,
    lng: 151.2153,
    categories: ['city_architecture', 'world_heritage', 'popular_destination'],
    coverImage: '/images/sydney-opera-house.jpg',
    gallery: ['/images/sydney-opera-house.jpg'],
    shortIntro: '壳状屋顶的现代建筑地标。',
    historyStory: '20 世纪最具辨识度的表演艺术建筑之一。',
    travelTips: '可购买内部导览与夜场演出联票。',
    funFacts: ['设计灵感来自风帆与贝壳。'],
    popularityScore: 95
  }
]
```

`apps/web/src/services/landmarkService.ts`:
```ts
import { landmarksSeed } from '../data/landmarks.seed'
import type { Landmark, LandmarkQuery } from '../types/landmark'

export interface LandmarkService {
  list(query?: LandmarkQuery): Promise<Landmark[]>
  getById(id: string): Promise<Landmark | null>
}

const includesText = (item: Landmark, query: string): boolean => {
  const q = query.toLowerCase()
  return [item.nameCn, item.nameEn, item.country, item.city].some((value) =>
    value.toLowerCase().includes(q)
  )
}

export const createLandmarkService = (seed: Landmark[]): LandmarkService => ({
  async list(query) {
    return seed.filter((item) => {
      const byQuery = query?.query ? includesText(item, query.query) : true
      const byCategory =
        query?.categories && query.categories.length > 0
          ? query.categories.some((category) => item.categories.includes(category))
          : true

      return byQuery && byCategory
    })
  },

  async getById(id) {
    return seed.find((item) => item.id === id) ?? null
  }
})

export const landmarkService = createLandmarkService(landmarksSeed)
```

- [ ] **Step 4: Re-run tests and verify pass**

Run:
```bash
npm run test -- src/services/landmarkService.test.ts
```
Expected: PASS (`3 passed`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/types/landmark.ts apps/web/src/data/landmarks.seed.ts apps/web/src/services/landmarkService.ts apps/web/src/services/landmarkService.test.ts
git commit -m "feat: add landmark domain model and seed repository"
```

---

### Task 3: Build explore state container + shell UI

**Depends on:** Task 1, Task 2  
**Files:**
- Create: `apps/web/src/state/explore-state.tsx`
- Create: `apps/web/src/components/search/SearchBar.tsx`
- Create: `apps/web/src/components/search/CategoryFilter.tsx`
- Test: `apps/web/src/state/explore-state.test.ts`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing reducer tests**

`apps/web/src/state/explore-state.test.ts`:
```ts
import { exploreReducer, initialExploreState } from './explore-state'

describe('exploreReducer', () => {
  it('sets search query', () => {
    const next = exploreReducer(initialExploreState, {
      type: 'SET_QUERY',
      payload: 'Paris'
    })

    expect(next.query).toBe('Paris')
  })

  it('toggles category membership', () => {
    const withCategory = exploreReducer(initialExploreState, {
      type: 'TOGGLE_CATEGORY',
      payload: 'world_heritage'
    })

    expect(withCategory.selectedCategories).toEqual(['world_heritage'])

    const withoutCategory = exploreReducer(withCategory, {
      type: 'TOGGLE_CATEGORY',
      payload: 'world_heritage'
    })

    expect(withoutCategory.selectedCategories).toEqual([])
  })

  it('tracks selected landmark', () => {
    const next = exploreReducer(initialExploreState, {
      type: 'SELECT_LANDMARK',
      payload: 'great-wall'
    })

    expect(next.selectedLandmarkId).toBe('great-wall')
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:
```bash
npm run test -- src/state/explore-state.test.ts
```
Expected: FAIL (`Cannot find module './explore-state'`).

- [ ] **Step 3: Implement reducer + provider + hook**

`apps/web/src/state/explore-state.tsx`:
```tsx
import { createContext, useContext, useMemo, useReducer, type Dispatch, type PropsWithChildren } from 'react'
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
```

- [ ] **Step 4: Implement search/filter controls and wire shell**

`apps/web/src/components/search/SearchBar.tsx`:
```tsx
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
```

`apps/web/src/components/search/CategoryFilter.tsx`:
```tsx
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
```

`apps/web/src/App.tsx`:
```tsx
import './App.css'
import { SearchBar } from './components/search/SearchBar'
import { CategoryFilter } from './components/search/CategoryFilter'
import { ExploreProvider, useExplore } from './state/explore-state'

function ExploreScreen() {
  const { state, dispatch } = useExplore()

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
    </main>
  )
}

export default function App() {
  return (
    <ExploreProvider>
      <ExploreScreen />
    </ExploreProvider>
  )
}
```

- [ ] **Step 5: Run tests and commit**

Run:
```bash
npm run test -- src/state/explore-state.test.ts src/App.test.tsx
```
Expected: PASS.

Commit:
```bash
git add apps/web/src/state/explore-state.tsx apps/web/src/state/explore-state.test.ts apps/web/src/components/search/SearchBar.tsx apps/web/src/components/search/CategoryFilter.tsx apps/web/src/App.tsx
git commit -m "feat: add explore state container and shell controls"
```

---

### Task 4: Implement 3D globe + hotspot rendering

**Depends on:** Task 2, Task 3  
**Files:**
- Create: `apps/web/src/lib/geo.ts`
- Test: `apps/web/src/lib/geo.test.ts`
- Create: `apps/web/src/components/globe/LandmarkHotspots.tsx`
- Create: `apps/web/src/components/globe/GlobeScene.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing geo conversion tests**

`apps/web/src/lib/geo.test.ts`:
```ts
import { latLngToCartesian } from './geo'

describe('latLngToCartesian', () => {
  it('maps equator and prime meridian to +X axis', () => {
    const point = latLngToCartesian(0, 0, 1)
    expect(point.x).toBeCloseTo(1, 4)
    expect(point.y).toBeCloseTo(0, 4)
    expect(point.z).toBeCloseTo(0, 4)
  })

  it('maps north pole to +Y axis', () => {
    const point = latLngToCartesian(90, 0, 1)
    expect(point.x).toBeCloseTo(0, 4)
    expect(point.y).toBeCloseTo(1, 4)
    expect(point.z).toBeCloseTo(0, 4)
  })
})
```

- [ ] **Step 2: Run test and verify failure**

Run:
```bash
npm run test -- src/lib/geo.test.ts
```
Expected: FAIL because `geo.ts` is missing.

- [ ] **Step 3: Implement geo helper and globe components**

`apps/web/src/lib/geo.ts`:
```ts
export function latLngToCartesian(lat: number, lng: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180

  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }
}
```

`apps/web/src/components/globe/LandmarkHotspots.tsx`:
```tsx
import { Html } from '@react-three/drei'
import type { Landmark } from '../../types/landmark'
import { latLngToCartesian } from '../../lib/geo'

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
```

`apps/web/src/components/globe/GlobeScene.tsx`:
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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
```

- [ ] **Step 4: Wire globe into App and verify interaction manually**

`apps/web/src/App.tsx` add:
```tsx
import { GlobeScene } from './components/globe/GlobeScene'
import { landmarksSeed } from './data/landmarks.seed'

// inside ExploreScreen return
<section style={{ height: '52vh' }}>
  <GlobeScene
    landmarks={landmarksSeed}
    selectedId={state.selectedLandmarkId}
    onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
  />
</section>
```

Manual run:
```bash
npm run dev
```
Expected: globe renders; clicking hotspot toggles selected state in React DevTools.

- [ ] **Step 5: Run tests and commit**

Run:
```bash
npm run test -- src/lib/geo.test.ts src/state/explore-state.test.ts
```
Expected: PASS.

Commit:
```bash
git add apps/web/src/lib/geo.ts apps/web/src/lib/geo.test.ts apps/web/src/components/globe/LandmarkHotspots.tsx apps/web/src/components/globe/GlobeScene.tsx apps/web/src/App.tsx
git commit -m "feat: render interactive 3d globe with landmark hotspots"
```

---

### Task 5: Add landmark detail drawer and card list fallback

**Depends on:** Task 2, Task 3, Task 4  
**Files:**
- Create: `apps/web/src/components/list/LandmarkList.tsx`
- Create: `apps/web/src/components/detail/LandmarkDetailDrawer.tsx`
- Test: `apps/web/src/components/detail/LandmarkDetailDrawer.test.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing detail drawer test**

`apps/web/src/components/detail/LandmarkDetailDrawer.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LandmarkDetailDrawer } from './LandmarkDetailDrawer'
import { landmarksSeed } from '../../data/landmarks.seed'

describe('LandmarkDetailDrawer', () => {
  it('shows selected landmark info and action callbacks', async () => {
    const user = userEvent.setup()
    const onWishToggle = vi.fn()
    const onVisitedToggle = vi.fn()

    render(
      <LandmarkDetailDrawer
        landmark={landmarksSeed[0]}
        isWishlisted={false}
        isVisited={false}
        onToggleWishlist={onWishToggle}
        onToggleVisited={onVisitedToggle}
      />
    )

    expect(screen.getByRole('heading', { name: landmarksSeed[0].nameCn })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '收藏想去' }))
    await user.click(screen.getByRole('button', { name: '标记去过' }))

    expect(onWishToggle).toHaveBeenCalledTimes(1)
    expect(onVisitedToggle).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test and verify failure**

Run:
```bash
npm run test -- src/components/detail/LandmarkDetailDrawer.test.tsx
```
Expected: FAIL (component not found).

- [ ] **Step 3: Implement detail drawer and landmark list components**

`apps/web/src/components/detail/LandmarkDetailDrawer.tsx`:
```tsx
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
```

`apps/web/src/components/list/LandmarkList.tsx`:
```tsx
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
```

- [ ] **Step 4: Wire detail flow in App**

`apps/web/src/App.tsx` add:
```tsx
import { LandmarkDetailDrawer } from './components/detail/LandmarkDetailDrawer'
import { LandmarkList } from './components/list/LandmarkList'

const selectedLandmark = landmarksSeed.find((item) => item.id === state.selectedLandmarkId) ?? null

<LandmarkList
  landmarks={landmarksSeed}
  selectedId={state.selectedLandmarkId}
  onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
/>

<LandmarkDetailDrawer
  landmark={selectedLandmark}
  isWishlisted={selectedLandmark ? state.wishlistIds.includes(selectedLandmark.id) : false}
  isVisited={selectedLandmark ? state.visitedIds.includes(selectedLandmark.id) : false}
  onToggleWishlist={() => selectedLandmark && dispatch({ type: 'TOGGLE_WISHLIST', payload: selectedLandmark.id })}
  onToggleVisited={() => selectedLandmark && dispatch({ type: 'TOGGLE_VISITED', payload: selectedLandmark.id })}
/>
```

- [ ] **Step 5: Run tests and commit**

Run:
```bash
npm run test -- src/components/detail/LandmarkDetailDrawer.test.tsx src/App.test.tsx
```
Expected: PASS.

Commit:
```bash
git add apps/web/src/components/detail/LandmarkDetailDrawer.tsx apps/web/src/components/detail/LandmarkDetailDrawer.test.tsx apps/web/src/components/list/LandmarkList.tsx apps/web/src/App.tsx
git commit -m "feat: add landmark detail drawer and selectable landmark list"
```

---

### Task 6: Implement search + category filtering logic

**Depends on:** Task 2, Task 3, Task 5  
**Files:**
- Create: `apps/web/src/lib/filter-landmarks.ts`
- Test: `apps/web/src/lib/filter-landmarks.test.ts`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing filter logic tests**

`apps/web/src/lib/filter-landmarks.test.ts`:
```ts
import { filterLandmarks } from './filter-landmarks'
import { landmarksSeed } from '../data/landmarks.seed'

describe('filterLandmarks', () => {
  it('returns query-matching landmarks case-insensitively', () => {
    const result = filterLandmarks(landmarksSeed, {
      query: 'wall',
      selectedCategories: []
    })

    expect(result.map((item) => item.id)).toEqual(['great-wall'])
  })

  it('returns landmarks that match at least one selected category', () => {
    const result = filterLandmarks(landmarksSeed, {
      query: '',
      selectedCategories: ['natural_wonder']
    })

    expect(result.every((item) => item.categories.includes('natural_wonder'))).toBe(true)
  })

  it('applies query and category together', () => {
    const result = filterLandmarks(landmarksSeed, {
      query: 'sydney',
      selectedCategories: ['city_architecture']
    })

    expect(result.map((item) => item.id)).toEqual(['sydney-opera-house'])
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:
```bash
npm run test -- src/lib/filter-landmarks.test.ts
```
Expected: FAIL (module missing).

- [ ] **Step 3: Implement pure filter function**

`apps/web/src/lib/filter-landmarks.ts`:
```ts
import type { Landmark, LandmarkCategory } from '../types/landmark'

interface FilterInput {
  query: string
  selectedCategories: LandmarkCategory[]
}

export function filterLandmarks(landmarks: Landmark[], input: FilterInput): Landmark[] {
  const q = input.query.trim().toLowerCase()

  return landmarks.filter((item) => {
    const matchesQuery =
      q.length === 0
        ? true
        : [item.nameCn, item.nameEn, item.country, item.city].some((field) =>
            field.toLowerCase().includes(q)
          )

    const matchesCategory =
      input.selectedCategories.length === 0
        ? true
        : input.selectedCategories.some((category) => item.categories.includes(category))

    return matchesQuery && matchesCategory
  })
}
```

- [ ] **Step 4: Wire filter output into app rendering**

`apps/web/src/App.tsx` add:
```tsx
import { filterLandmarks } from './lib/filter-landmarks'

const visibleLandmarks = filterLandmarks(landmarksSeed, {
  query: state.query,
  selectedCategories: state.selectedCategories
})

<GlobeScene
  landmarks={visibleLandmarks}
  selectedId={state.selectedLandmarkId}
  onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
/>

<LandmarkList
  landmarks={visibleLandmarks}
  selectedId={state.selectedLandmarkId}
  onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
/>
```

- [ ] **Step 5: Run tests and commit**

Run:
```bash
npm run test -- src/lib/filter-landmarks.test.ts src/state/explore-state.test.ts
```
Expected: PASS.

Commit:
```bash
git add apps/web/src/lib/filter-landmarks.ts apps/web/src/lib/filter-landmarks.test.ts apps/web/src/App.tsx
git commit -m "feat: add search and category filtering pipeline"
```

---

### Task 7: Persist 收藏/打卡 state in localStorage

**Depends on:** Task 3, Task 5  
**Files:**
- Create: `apps/web/src/services/userActionStorage.ts`
- Test: `apps/web/src/services/userActionStorage.test.ts`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing storage tests**

`apps/web/src/services/userActionStorage.test.ts`:
```ts
import { loadUserActions, saveUserActions } from './userActionStorage'

describe('userActionStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty defaults when localStorage is empty', () => {
    expect(loadUserActions()).toEqual({ wishlistIds: [], visitedIds: [] })
  })

  it('saves and loads user actions', () => {
    saveUserActions({ wishlistIds: ['eiffel-tower'], visitedIds: ['great-wall'] })

    expect(loadUserActions()).toEqual({
      wishlistIds: ['eiffel-tower'],
      visitedIds: ['great-wall']
    })
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:
```bash
npm run test -- src/services/userActionStorage.test.ts
```
Expected: FAIL because storage service does not exist.

- [ ] **Step 3: Implement storage service and app hydration/persistence effects**

`apps/web/src/services/userActionStorage.ts`:
```ts
const STORAGE_KEY = 'dream-globe.user-actions.v1'

export interface UserActionSnapshot {
  wishlistIds: string[]
  visitedIds: string[]
}

export function loadUserActions(): UserActionSnapshot {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { wishlistIds: [], visitedIds: [] }
  }

  try {
    const parsed = JSON.parse(raw) as UserActionSnapshot
    return {
      wishlistIds: parsed.wishlistIds ?? [],
      visitedIds: parsed.visitedIds ?? []
    }
  } catch {
    return { wishlistIds: [], visitedIds: [] }
  }
}

export function saveUserActions(snapshot: UserActionSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}
```

`apps/web/src/App.tsx` add:
```tsx
import { useEffect } from 'react'
import { loadUserActions, saveUserActions } from './services/userActionStorage'

useEffect(() => {
  dispatch({ type: 'HYDRATE_USER_ACTIONS', payload: loadUserActions() })
}, [dispatch])

useEffect(() => {
  saveUserActions({
    wishlistIds: state.wishlistIds,
    visitedIds: state.visitedIds
  })
}, [state.wishlistIds, state.visitedIds])
```

- [ ] **Step 4: Run tests and manual refresh check**

Run:
```bash
npm run test -- src/services/userActionStorage.test.ts src/components/detail/LandmarkDetailDrawer.test.tsx
npm run dev
```
Expected:
- Tests PASS.
- Manual check: select landmark → click 收藏想去 → refresh page → button becomes `取消收藏`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/userActionStorage.ts apps/web/src/services/userActionStorage.test.ts apps/web/src/App.tsx
git commit -m "feat: persist wishlist and visited states"
```

---

### Task 8: Add recommendation ranking and recommendation panel

**Depends on:** Task 2, Task 6, Task 7  
**Files:**
- Create: `apps/web/src/lib/recommend.ts`
- Test: `apps/web/src/lib/recommend.test.ts`
- Create: `apps/web/src/components/recommendation/RecommendationPanel.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing recommendation tests**

`apps/web/src/lib/recommend.test.ts`:
```ts
import { buildRecommendations } from './recommend'
import { landmarksSeed } from '../data/landmarks.seed'

describe('buildRecommendations', () => {
  it('boosts categories related to wishlist/visited history', () => {
    const result = buildRecommendations({
      landmarks: landmarksSeed,
      selectedCategories: [],
      wishlistIds: ['eiffel-tower'],
      visitedIds: [],
      selectedLandmarkId: null,
      limit: 3
    })

    expect(result[0].categories.includes('city_architecture')).toBe(true)
  })

  it('excludes currently selected and visited landmarks', () => {
    const result = buildRecommendations({
      landmarks: landmarksSeed,
      selectedCategories: ['historical_site'],
      wishlistIds: [],
      visitedIds: ['great-wall'],
      selectedLandmarkId: 'machu-picchu',
      limit: 10
    })

    const ids = result.map((item) => item.id)
    expect(ids).not.toContain('great-wall')
    expect(ids).not.toContain('machu-picchu')
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:
```bash
npm run test -- src/lib/recommend.test.ts
```
Expected: FAIL because recommend module is missing.

- [ ] **Step 3: Implement ranking logic**

`apps/web/src/lib/recommend.ts`:
```ts
import type { Landmark, LandmarkCategory } from '../types/landmark'

interface RecommendInput {
  landmarks: Landmark[]
  selectedCategories: LandmarkCategory[]
  wishlistIds: string[]
  visitedIds: string[]
  selectedLandmarkId: string | null
  limit: number
}

export function buildRecommendations(input: RecommendInput): Landmark[] {
  const preferredCategorySet = new Set<LandmarkCategory>(input.selectedCategories)

  for (const landmark of input.landmarks) {
    if (input.wishlistIds.includes(landmark.id) || input.visitedIds.includes(landmark.id)) {
      landmark.categories.forEach((category) => preferredCategorySet.add(category))
    }
  }

  return input.landmarks
    .filter((item) => !input.visitedIds.includes(item.id))
    .filter((item) => item.id !== input.selectedLandmarkId)
    .map((item) => {
      const categoryScore = item.categories.reduce(
        (sum, category) => sum + (preferredCategorySet.has(category) ? 3 : 0),
        0
      )
      const popularityScore = item.popularityScore / 100
      return {
        item,
        score: categoryScore + popularityScore
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit)
    .map((entry) => entry.item)
}
```

- [ ] **Step 4: Implement recommendation panel and wire into App**

`apps/web/src/components/recommendation/RecommendationPanel.tsx`:
```tsx
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
```

`apps/web/src/App.tsx` add:
```tsx
import { buildRecommendations } from './lib/recommend'
import { RecommendationPanel } from './components/recommendation/RecommendationPanel'

const recommendations = buildRecommendations({
  landmarks: landmarksSeed,
  selectedCategories: state.selectedCategories,
  wishlistIds: state.wishlistIds,
  visitedIds: state.visitedIds,
  selectedLandmarkId: state.selectedLandmarkId,
  limit: 4
})

<RecommendationPanel
  landmarks={recommendations}
  onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })}
/>
```

- [ ] **Step 5: Run tests and commit**

Run:
```bash
npm run test -- src/lib/recommend.test.ts src/lib/filter-landmarks.test.ts
```
Expected: PASS.

Commit:
```bash
git add apps/web/src/lib/recommend.ts apps/web/src/lib/recommend.test.ts apps/web/src/components/recommendation/RecommendationPanel.tsx apps/web/src/App.tsx
git commit -m "feat: add rule-based landmark recommendations"
```

---

### Task 9: Add loading/error/empty states and async loading flow

**Depends on:** Task 2, Task 3, Task 6  
**Files:**
- Create: `apps/web/src/components/states/LoadingState.tsx`
- Create: `apps/web/src/components/states/ErrorState.tsx`
- Create: `apps/web/src/components/states/EmptyState.tsx`
- Test: `apps/web/src/App.state.test.tsx`
- Modify: `apps/web/src/services/landmarkService.ts`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing app state tests with injected service**

`apps/web/src/App.state.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { LandmarkService } from './services/landmarkService'

const createRejectingService = (): LandmarkService => ({
  list: async () => {
    throw new Error('network failure')
  },
  getById: async () => null
})

describe('App loading states', () => {
  it('shows retry UI when list request fails', async () => {
    const user = userEvent.setup()
    render(<App service={createRejectingService()} />)

    await waitFor(() => {
      expect(screen.getByText('地标加载失败')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(screen.getByText('地标加载失败')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test and verify failure**

Run:
```bash
npm run test -- src/App.state.test.tsx
```
Expected: FAIL because App currently has no injectable service and no loading/error state.

- [ ] **Step 3: Implement async service and state components**

`apps/web/src/services/landmarkService.ts` update:
```ts
// add small async delay for realistic loading state
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const createLandmarkService = (seed: Landmark[]): LandmarkService => ({
  async list(query) {
    await delay(80)
    return seed.filter((item) => {
      const byQuery = query?.query ? includesText(item, query.query) : true
      const byCategory =
        query?.categories && query.categories.length > 0
          ? query.categories.some((category) => item.categories.includes(category))
          : true

      return byQuery && byCategory
    })
  },
  async getById(id) {
    await delay(20)
    return seed.find((item) => item.id === id) ?? null
  }
})
```

`apps/web/src/components/states/LoadingState.tsx`:
```tsx
export function LoadingState() {
  return <p>正在加载地标数据...</p>
}
```

`apps/web/src/components/states/ErrorState.tsx`:
```tsx
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
```

`apps/web/src/components/states/EmptyState.tsx`:
```tsx
export function EmptyState() {
  return <p>未找到匹配地标，试试其他关键词或分类。</p>
}
```

- [ ] **Step 4: Update App to handle loading/error/empty flow**

`apps/web/src/App.tsx` key changes:
```tsx
import { useEffect, useMemo, useState } from 'react'
import type { Landmark } from './types/landmark'
import type { LandmarkService } from './services/landmarkService'
import { landmarkService } from './services/landmarkService'
import { LoadingState } from './components/states/LoadingState'
import { ErrorState } from './components/states/ErrorState'
import { EmptyState } from './components/states/EmptyState'

interface AppProps {
  service?: LandmarkService
}

function ExploreScreen({ service }: { service: LandmarkService }) {
  const { state, dispatch } = useExplore()
  const [allLandmarks, setAllLandmarks] = useState<Landmark[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

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

  const visibleLandmarks = useMemo(
    () =>
      filterLandmarks(allLandmarks, {
        query: state.query,
        selectedCategories: state.selectedCategories
      }),
    [allLandmarks, state.query, state.selectedCategories]
  )

  if (loadState === 'loading') return <LoadingState />
  if (loadState === 'error') return <ErrorState onRetry={() => void loadLandmarks()} />

  return (
    <main>
      {/* existing sections */}
      {visibleLandmarks.length === 0 ? <EmptyState /> : <LandmarkList landmarks={visibleLandmarks} selectedId={state.selectedLandmarkId} onSelect={(id) => dispatch({ type: 'SELECT_LANDMARK', payload: id })} />}
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
```

- [ ] **Step 5: Run tests and commit**

Run:
```bash
npm run test -- src/App.state.test.tsx src/services/landmarkService.test.ts
```
Expected: PASS.

Commit:
```bash
git add apps/web/src/components/states/LoadingState.tsx apps/web/src/components/states/ErrorState.tsx apps/web/src/components/states/EmptyState.tsx apps/web/src/App.state.test.tsx apps/web/src/services/landmarkService.ts apps/web/src/App.tsx
git commit -m "feat: add loading error and empty states for landmark data"
```

---

### Task 10: Add e2e journey + delivery runbook + final quality gate

**Depends on:** Task 1-9  
**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/e2e/mvp-flow.spec.ts`
- Create: `apps/web/README.md`

- [ ] **Step 1: Write e2e test for core user journey**

`apps/web/tests/e2e/mvp-flow.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('search landmark, open detail, wishlist persists after refresh', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('搜索国家/城市/地标').fill('Eiffel')
  await expect(page.getByRole('button', { name: 'Eiffel Tower' })).toBeVisible()

  await page.getByRole('button', { name: 'Eiffel Tower' }).click()
  await expect(page.getByRole('heading', { name: '埃菲尔铁塔' })).toBeVisible()

  await page.getByRole('button', { name: '收藏想去' }).click()
  await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()

  await page.reload()
  await page.getByPlaceholder('搜索国家/城市/地标').fill('Eiffel')
  await page.getByRole('button', { name: 'Eiffel Tower' }).click()

  await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()
})
```

- [ ] **Step 2: Configure Playwright**

`apps/web/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI
  }
})
```

- [ ] **Step 3: Write runbook for local verification**

`apps/web/README.md`:
```md
# Dream Globe MVP (Web)

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm run test
npm run test:e2e
```

## MVP validation checklist

- Home shows 3D globe and category chips
- Search narrows landmarks in list and globe hotspots
- Clicking a landmark opens detail drawer
- 收藏想去/标记去过 can toggle
- Refresh keeps 收藏/打卡 state
- Recommendation section updates after user actions
- Loading, error, empty states all render under expected conditions
```

- [ ] **Step 4: Run final quality gate commands**

Run:
```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```
Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/tests/e2e/mvp-flow.spec.ts apps/web/README.md
git commit -m "test: add e2e journey and delivery runbook"
```

---

## Final Acceptance Criteria

- 用户可在 3D 地球和列表两种方式浏览并选择地标。
- 地标详情可展示简介、历史、旅行建议，并可执行收藏/打卡。
- 搜索与分类筛选联动生效。
- 推荐面板可基于用户行为给出结果。
- 页面具备加载、失败、空结果三种状态。
- 单元测试 + e2e + build 全部通过。

## Risk Controls

- **WebGL performance risk:** keep mesh simple (single sphere + HTML markers) in MVP.
- **Data scale risk:** start with curated seed dataset; paginate later with API backend.
- **State drift risk:** keep reducer pure and cover actions via unit tests.
- **E2E fragility risk:** use list/button selectors for stable automation; do not depend on canvas pixel clicks.
