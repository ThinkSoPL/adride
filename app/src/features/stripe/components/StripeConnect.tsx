'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createStripeConnectLink,
  verifyStripeConnectStatus,
} from '../lib/stripe-api';

interface StripeConnectProps {
  driverId: string;
  onConnected?: () => void;
}

export function StripeConnect({ driverId, onConnected }: StripeConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = useCallback(async () => {
    setLoading(true);
    const result = await verifyStripeConnectStatus(driverId);
    setIsConnected(result.connected);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }, [driverId]);

  const handleConnect = useCallback(async () => {
    setIsCreatingLink(true);
    setError(null);

    const result = await createStripeConnectLink(driverId);

    if (result.error) {
      setError(result.error);
      setIsCreatingLink(false);
      return;
    }

    // Redirect to Stripe Connect onboarding
    if (result.url) {
      window.location.href = result.url;
    }
  }, [driverId]);

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#1B2332',
          borderRadius: '10px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#718096' }}>Sprawdzanie statusu...</p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '10px',
          color: '#34D399',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>✓</span>
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
              Konto Stripe Connect aktywne
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#10B981' }}>
              Możesz otrzymywać przychody ze swoich kampanii
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#1B2332',
        border: '1px solid #364156',
        borderRadius: '12px',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#E6EDF3',
        }}
      >
        Podłącz konto bankowe
      </h3>
      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: '#A0AEC0',
          lineHeight: '1.5',
        }}
      >
        Aby otrzymywać przychody ze swoich kampanii reklamowych, musisz połączyć konto Stripe
        Connect. Bezpieczne, szybkie i bez prowizji za konfigurację.
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(252, 165, 165, 0.1)',
            border: '1px solid rgba(252, 165, 165, 0.3)',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#FCA5A5',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isCreatingLink}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#FF6B35',
          color: '#FFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isCreatingLink ? 'not-allowed' : 'pointer',
          opacity: isCreatingLink ? 0.6 : 1,
        }}
      >
        {isCreatingLink ? 'Przygotowanie...' : '🔗 Połącz Stripe Connect'}
      </button>

      <p
        style={{
          margin: '16px 0 0 0',
          fontSize: '12px',
          color: '#718096',
          textAlign: 'center',
        }}
      >
        Zostaniesz przekierowany do Stripe w bezpiecznym oknie
      </p>
    </div>
  );
}
