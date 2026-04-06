import { create } from 'zustand'

interface FavoritesState {
  ids: number[]
  loaded: boolean
  setFavorites: (ids: number[]) => void
  add: (id: number) => void
  remove: (id: number) => void
  has: (id: number) => boolean
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  ids: [],
  loaded: false,

  setFavorites: (ids) => set({ ids, loaded: true }),

  add: (id) =>
    set((state) => ({
      ids: state.ids.includes(id) ? state.ids : [...state.ids, id],
    })),

  remove: (id) =>
    set((state) => ({
      ids: state.ids.filter((i) => i !== id),
    })),

  has: (id) => get().ids.includes(id),
}))
