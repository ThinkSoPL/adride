export type VehicleStatus = 'active' | 'offline' | 'service';
export type SortField = 'plate' | 'revenue' | 'km' | 'status';
export type SortOrder = 'asc' | 'desc';
export type Theme = 'light' | 'dark';

export interface FilterState {
  status: VehicleStatus | 'all';
  searchQuery: string;
}

export interface SortState {
  field: SortField;
  order: SortOrder;
}

export interface FleetStats {
  totalRevenueToday: number;
  totalRevenueWeek: number;
  totalRevenueMonth: number;
  activeVehicles: number;
  offlineVehicles: number;
  serviceVehicles: number;
  averageRevenuePerVehicle: number;
  totalKmToday: number;
}
