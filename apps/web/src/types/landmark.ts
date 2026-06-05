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
