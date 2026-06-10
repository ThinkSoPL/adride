'use client';

import { useState } from 'react';
import type { Vehicle } from '../data/mockFleetData';
import { MOCK_FLEET_DATA } from '../data/mockFleetData';
import { calculateFleetStats } from '../lib/calculations';
import { useFleetTheme } from '../hooks/useFleetTheme';
import { FleetOverview } from '../components/FleetOverview';
import { VehicleTable } from '../components/VehicleTable';
import { VehicleDetails } from './VehicleDetails';

export function FleetDashboard() {
  const { theme, toggleTheme, colors, isMounted } = useFleetTheme();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'offline' | 'service'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isMounted) return null;

  const stats = calculateFleetStats(MOCK_FLEET_DATA.vehicles);

  const filteredVehicles = MOCK_FLEET_DATA.vehicles.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesSearch =
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (selectedVehicle) {
    return (
      <VehicleDetails
        vehicle={selectedVehicle}
        owner={MOCK_FLEET_DATA.owner}
        isDark={theme === 'dark'}
        onBack={() => setSelectedVehicle(null)}
        colors={colors}
      />
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.text, minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSecondary,
          padding: '24px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
                Przegląd floty
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>
                {MOCK_FLEET_DATA.owner.name}
              </p>
            </div>
            <button
              onClick={() => toggleTheme()}
              style={{
                padding: '8px 16px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bgTertiary,
                color: colors.text,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {theme === 'dark' ? '☀️ Jasny' : '🌙 Ciemny'}
            </button>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Szukaj pojazdu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bg,
                color: colors.text,
                borderRadius: '6px',
                fontSize: '14px',
                flex: 1,
                minWidth: '200px',
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'all' || v === 'active' || v === 'offline' || v === 'service') {
                  setStatusFilter(v);
                }
              }}
              aria-label="Filtruj pojazdy po statusie"
              style={{
                padding: '10px 14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bg,
                color: colors.text,
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="offline">Offline</option>
              <option value="service">W serwisie</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <FleetOverview stats={stats} isDark={theme === 'dark'} />

        {/* Vehicles Table */}
        <div
          style={{
            backgroundColor: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              Samochody ({filteredVehicles.length})
            </h2>
          </div>
          {filteredVehicles.length === 0 ? (
            <div
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                color: colors.textSecondary,
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                Brak pojazdów spełniających kryteria
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Zmień filtry lub wyszukiwanie, aby zobaczyć więcej pojazdów.
              </p>
            </div>
          ) : (
            <VehicleTable
              vehicles={filteredVehicles}
              isDark={theme === 'dark'}
              onVehicleSelect={setSelectedVehicle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
