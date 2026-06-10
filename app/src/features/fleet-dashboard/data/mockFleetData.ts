export type VehicleStatus = 'active' | 'offline' | 'service';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: VehicleStatus;
  kmToday: number;
  kmThisMonthBilled: number;
  revenueToday: number;
  revenueThisMonth: number;
  advertisingPackage: string;
  lastSyncAt: string;
  ratePerKm: number;
  platformCommissionPercent: number;
  dailyRevenueHistory: number[]; // Last 30 days
  dailyKmHistory: number[]; // Last 30 days
}

export interface FleetData {
  owner: {
    id: string;
    name: string;
    email: string;
  };
  vehicles: Vehicle[];
}

const generateDailyHistory = (baseValue: number, days: number = 30): number[] => {
  return Array.from({ length: days }, () =>
    Math.max(0, baseValue + (Math.random() - 0.5) * baseValue * 0.4),
  );
};

const generateKmHistory = (baseValue: number, days: number = 30): number[] => {
  return Array.from({ length: days }, () =>
    Math.max(0, baseValue + (Math.random() - 0.5) * baseValue * 0.3),
  );
};

export const MOCK_FLEET_DATA: FleetData = {
  owner: {
    id: 'owner-001',
    name: 'Tomasz Nowak',
    email: 'tomasz@flota-transport.pl',
  },
  vehicles: [
    {
      id: 'v1',
      plate: 'WA 12345',
      model: 'Audi A4 Sedan',
      status: 'active',
      kmToday: 127.3,
      kmThisMonthBilled: 3250,
      revenueToday: 509.2,
      revenueThisMonth: 13000,
      advertisingPackage: 'Premium (całe auto)',
      lastSyncAt: new Date(Date.now() - 5 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(450),
      dailyKmHistory: generateKmHistory(112),
    },
    {
      id: 'v2',
      plate: 'WA 23456',
      model: 'BMW 5 Series',
      status: 'active',
      kmToday: 95.8,
      kmThisMonthBilled: 2840,
      revenueToday: 383.2,
      revenueThisMonth: 11360,
      advertisingPackage: 'Premium (całe auto)',
      lastSyncAt: new Date(Date.now() - 12 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(380),
      dailyKmHistory: generateKmHistory(95),
    },
    {
      id: 'v3',
      plate: 'WA 34567',
      model: 'Mercedes C-Class',
      status: 'active',
      kmToday: 142.5,
      kmThisMonthBilled: 3680,
      revenueToday: 570.0,
      revenueThisMonth: 14720,
      advertisingPackage: 'Deluxe (boki + dach)',
      lastSyncAt: new Date(Date.now() - 3 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(490),
      dailyKmHistory: generateKmHistory(142),
    },
    {
      id: 'v4',
      plate: 'WA 45678',
      model: 'Volkswagen Passat',
      status: 'offline',
      kmToday: 0,
      kmThisMonthBilled: 1950,
      revenueToday: 0,
      revenueThisMonth: 7800,
      advertisingPackage: 'Standard (boki)',
      lastSyncAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(280),
      dailyKmHistory: generateKmHistory(75),
    },
    {
      id: 'v5',
      plate: 'WA 56789',
      model: 'Tesla Model 3',
      status: 'active',
      kmToday: 156.2,
      kmThisMonthBilled: 3920,
      revenueToday: 624.8,
      revenueThisMonth: 15680,
      advertisingPackage: 'Premium (całe auto)',
      lastSyncAt: new Date(Date.now() - 2 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(520),
      dailyKmHistory: generateKmHistory(156),
    },
    {
      id: 'v6',
      plate: 'WA 67890',
      model: 'Skoda Octavia',
      status: 'service',
      kmToday: 0,
      kmThisMonthBilled: 2100,
      revenueToday: 0,
      revenueThisMonth: 8400,
      advertisingPackage: 'Standard (boki)',
      lastSyncAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(300),
      dailyKmHistory: generateKmHistory(85),
    },
    {
      id: 'v7',
      plate: 'WA 78901',
      model: 'Hyundai Tucson',
      status: 'active',
      kmToday: 118.6,
      kmThisMonthBilled: 3100,
      revenueToday: 474.4,
      revenueThisMonth: 12400,
      advertisingPackage: 'Premium (całe auto)',
      lastSyncAt: new Date(Date.now() - 8 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(410),
      dailyKmHistory: generateKmHistory(118),
    },
    {
      id: 'v8',
      plate: 'WA 89012',
      model: 'Toyota Corolla',
      status: 'active',
      kmToday: 89.4,
      kmThisMonthBilled: 2650,
      revenueToday: 357.6,
      revenueThisMonth: 10600,
      advertisingPackage: 'Standard (boki)',
      lastSyncAt: new Date(Date.now() - 15 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(350),
      dailyKmHistory: generateKmHistory(89),
    },
    {
      id: 'v9',
      plate: 'WA 90123',
      model: 'Ford Focus',
      status: 'active',
      kmToday: 134.7,
      kmThisMonthBilled: 3400,
      revenueToday: 538.8,
      revenueThisMonth: 13600,
      advertisingPackage: 'Deluxe (boki + dach)',
      lastSyncAt: new Date(Date.now() - 6 * 60000).toISOString(),
      ratePerKm: 4.0,
      platformCommissionPercent: 15,
      dailyRevenueHistory: generateDailyHistory(450),
      dailyKmHistory: generateKmHistory(134),
    },
  ],
};
