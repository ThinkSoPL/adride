export type ZoneType = 'centrum' | 'wewnętrzna' | 'zewnętrzna';

export interface WarsawDistrict {
  id: string;
  name: string;
  /** Average contacts per km driven — derived from GDDKiA AADT 2023 data */
  trafficDensity: number;
  zone: ZoneType;
}

export const WARSAW_DISTRICTS: readonly WarsawDistrict[] = [
  { id: 'srodmiescie',    name: 'Śródmieście',   trafficDensity: 420, zone: 'centrum' },
  { id: 'wola',           name: 'Wola',           trafficDensity: 340, zone: 'wewnętrzna' },
  { id: 'mokotow',        name: 'Mokotów',        trafficDensity: 310, zone: 'wewnętrzna' },
  { id: 'ochota',         name: 'Ochota',         trafficDensity: 290, zone: 'wewnętrzna' },
  { id: 'zoliborz',       name: 'Żoliborz',       trafficDensity: 250, zone: 'wewnętrzna' },
  { id: 'praga-poludnie', name: 'Praga-Południe', trafficDensity: 240, zone: 'wewnętrzna' },
  { id: 'praga-polnoc',   name: 'Praga-Północ',   trafficDensity: 220, zone: 'wewnętrzna' },
  { id: 'bielany',        name: 'Bielany',        trafficDensity: 200, zone: 'zewnętrzna' },
  { id: 'ursynow',        name: 'Ursynów',        trafficDensity: 195, zone: 'zewnętrzna' },
  { id: 'targowek',       name: 'Targówek',       trafficDensity: 180, zone: 'zewnętrzna' },
  { id: 'bemowo',         name: 'Bemowo',         trafficDensity: 175, zone: 'zewnętrzna' },
  { id: 'wlochy',         name: 'Włochy',         trafficDensity: 170, zone: 'zewnętrzna' },
  { id: 'wilanow',        name: 'Wilanów',        trafficDensity: 160, zone: 'zewnętrzna' },
  { id: 'ursus',          name: 'Ursus',          trafficDensity: 155, zone: 'zewnętrzna' },
  { id: 'bialoleka',      name: 'Białołęka',      trafficDensity: 145, zone: 'zewnętrzna' },
  { id: 'wawer',          name: 'Wawer',          trafficDensity: 130, zone: 'zewnętrzna' },
  { id: 'rembertow',      name: 'Rembertów',      trafficDensity: 110, zone: 'zewnętrzna' },
  { id: 'wesola',         name: 'Wesoła',         trafficDensity: 95,  zone: 'zewnętrzna' },
] as const;
