import type { Metadata } from 'next';
import { FleetDashboard } from '@/features/fleet-dashboard';

export const metadata: Metadata = {
  title: 'Przegląd floty | AdRide',
  description: 'Dashboard dla właścicieli floty samochodów reklamowych. Śledź przychody, status pojazdów i statystyki w czasie rzeczywistym.',
};

export default function FlotaPage() {
  return <FleetDashboard />;
}
