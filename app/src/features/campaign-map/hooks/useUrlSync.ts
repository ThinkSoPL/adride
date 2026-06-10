'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMapStore } from '../store';
import { startOfDay, endOfDay, parseISO, format, isValid } from 'date-fns';

/**
 * Dwukierunkowa synchronizacja filtrów ↔ URL searchParams.
 * Format: ?from=YYYY-MM-DD&to=YYYY-MM-DD&vehicles=id1,id2&hours=0-24
 */
export function useUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMapStore((s) => s.filters);
  const setDateRange = useMapStore((s) => s.setDateRange);
  const setFilters = useMapStore((s) => s.setFilters);
  const setTimeOfDay = useMapStore((s) => s.setTimeOfDay);

  const hydratedRef = useRef(false);
  const initialRunRef = useRef(true);

  // URL → store (jednorazowo przy mount)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam && toParam) {
      const from = parseISO(fromParam);
      const to = parseISO(toParam);
      if (isValid(from) && isValid(to)) {
        setDateRange(startOfDay(from), endOfDay(to));
      }
    }

    const vehiclesParam = searchParams.get('vehicles');
    if (vehiclesParam) {
      setFilters({ vehicleIds: vehiclesParam.split(',').filter(Boolean) });
    }

    const hoursParam = searchParams.get('hours');
    if (hoursParam) {
      const parts = hoursParam.split('-').map(Number);
      if (
        parts.length === 2 &&
        Number.isFinite(parts[0]) &&
        Number.isFinite(parts[1])
      ) {
        setTimeOfDay([parts[0]!, parts[1]!]);
      }
    }
  }, [searchParams, setDateRange, setFilters, setTimeOfDay]);

  // store → URL (każda zmiana filtra)
  useEffect(() => {
    if (initialRunRef.current) {
      initialRunRef.current = false;
      return;
    }
    if (!hydratedRef.current) return;

    const params = new URLSearchParams();
    params.set('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
    params.set('to', format(filters.dateRange.to, 'yyyy-MM-dd'));
    if (filters.vehicleIds.length > 0) {
      params.set('vehicles', filters.vehicleIds.join(','));
    }
    if (filters.timeOfDay[0] !== 0 || filters.timeOfDay[1] !== 24) {
      params.set('hours', `${filters.timeOfDay[0]}-${filters.timeOfDay[1]}`);
    }

    const nextUrl = `${pathname}?${params.toString()}`;
    router.replace(nextUrl, { scroll: false });
  }, [filters, pathname, router]);
}
