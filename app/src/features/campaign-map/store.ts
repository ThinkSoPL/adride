// =============================================================================
// AdRide Campaign Map — Zustand store
// Stan filtrów, wybranego pojazdu i preferencji UI
// =============================================================================

import { create } from 'zustand';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import type {
  MapFilters,
  MapStyleId,
  VehicleMarker,
  VehicleSummary,
} from './types';

// ─── Wartości domyślne ────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: MapFilters = {
  dateRange: {
    from: startOfDay(subDays(new Date(), 7)),
    to: endOfDay(new Date()),
  },
  vehicleIds: [],
  districts: [],
  layerVisibility: {
    routes: true,
    heatmap: false,
    live: true,
    districts: false,
  },
  timeOfDay: [0, 24],
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface MapState {
  // Filtry (synchronizowane z URL)
  filters: MapFilters;

  // Zaznaczony pojazd (popup)
  selectedVehicle: VehicleSummary | null;

  // ID sesji nad którą jest kursor (hover highlight)
  hoveredSessionId: string | null;

  // Live positions pojazdów (aktualizowane przez Realtime)
  liveVehicles: Map<string, VehicleMarker>;

  // Styl mapy
  mapStyle: MapStyleId;

  // Tryb wysokiego kontrastu (dostępność)
  highContrast: boolean;

  // Auto-play TimeSlider
  isPlaying: boolean;

  // Aktualna godzina podczas odtwarzania (0-24)
  playbackHour: number;

  // ─── Akcje ─────────────────────────────────────────────────────────────────

  setFilters: (partial: Partial<MapFilters>) => void;
  setDateRange: (from: Date, to: Date) => void;
  toggleVehicle: (vehicleId: string) => void;
  toggleDistrict: (district: string) => void;
  toggleLayer: (layer: keyof MapFilters['layerVisibility']) => void;
  setTimeOfDay: (range: [number, number]) => void;
  resetFilters: () => void;

  setSelectedVehicle: (vehicle: VehicleSummary | null) => void;
  setHoveredSessionId: (id: string | null) => void;

  upsertLiveVehicle: (marker: VehicleMarker) => void;
  removeStaleLiveVehicles: () => void;

  setMapStyle: (style: MapStyleId) => void;
  setHighContrast: (enabled: boolean) => void;

  setIsPlaying: (playing: boolean) => void;
  setPlaybackHour: (hour: number) => void;
}

// =============================================================================
// Zustand store
// =============================================================================

export const useMapStore = create<MapState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  selectedVehicle: null,
  hoveredSessionId: null,
  liveVehicles: new Map(),
  mapStyle: 'dark',
  highContrast: false,
  isPlaying: false,
  playbackHour: 0,

  // ─── Filtry ───────────────────────────────────────────────────────────────

  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  setDateRange: (from, to) =>
    set((state) => ({
      filters: { ...state.filters, dateRange: { from, to } },
    })),

  toggleVehicle: (vehicleId) =>
    set((state) => {
      const ids = state.filters.vehicleIds;
      const next = ids.includes(vehicleId)
        ? ids.filter((id) => id !== vehicleId)
        : [...ids, vehicleId];
      return { filters: { ...state.filters, vehicleIds: next } };
    }),

  toggleDistrict: (district) =>
    set((state) => {
      const ds = state.filters.districts;
      const next = ds.includes(district)
        ? ds.filter((d) => d !== district)
        : [...ds, district];
      return { filters: { ...state.filters, districts: next } };
    }),

  toggleLayer: (layer) =>
    set((state) => ({
      filters: {
        ...state.filters,
        layerVisibility: {
          ...state.filters.layerVisibility,
          [layer]: !state.filters.layerVisibility[layer],
        },
      },
    })),

  setTimeOfDay: (range) =>
    set((state) => ({ filters: { ...state.filters, timeOfDay: range } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  // ─── Selekcja i hover ─────────────────────────────────────────────────────

  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  setHoveredSessionId: (id) => set({ hoveredSessionId: id }),

  // ─── Live vehicles ────────────────────────────────────────────────────────

  upsertLiveVehicle: (marker) =>
    set((state) => {
      const next = new Map(state.liveVehicles);
      next.set(marker.vehicleId, marker);
      return { liveVehicles: next };
    }),

  removeStaleLiveVehicles: () =>
    set((state) => {
      const cutoff = Date.now() - 5 * 60 * 1000; // 5 minut
      const next = new Map(state.liveVehicles);
      for (const [id, marker] of next.entries()) {
        if (new Date(marker.lastSeen).getTime() < cutoff) {
          next.delete(id);
        }
      }
      return { liveVehicles: next };
    }),

  // ─── Ustawienia ───────────────────────────────────────────────────────────

  setMapStyle: (style) => set({ mapStyle: style }),
  setHighContrast: (enabled) => set({ highContrast: enabled }),

  // ─── TimeSlider playback ──────────────────────────────────────────────────

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackHour: (hour) => set({ playbackHour: hour }),
}));

// ─── Selektory (memoizowane w komponentach przez shallow) ─────────────────────

export const selectFilters = (s: MapState) => s.filters;
export const selectLiveVehiclesArray = (s: MapState) =>
  Array.from(s.liveVehicles.values());
