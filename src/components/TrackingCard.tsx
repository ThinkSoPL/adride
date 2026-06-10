import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGpsTracking } from 'src/modules/gps-tracking';
import type { ActiveCampaign } from '../lib/queries-mobile';

interface TrackingCardProps {
  activeCampaign: ActiveCampaign | null;
}

export function TrackingCard({ activeCampaign }: TrackingCardProps) {
  const { isTracking, status, session, error, start, stop, pause } = useGpsTracking();

  const handleToggle = async () => {
    if (status === 'active') {
      await pause();
    } else if (status === 'paused') {
      // resume jest obsługiwane przez ponowny start z tym samym vehicleId/campaignId
      // W uproszczonej wersji wznowienie = stop + start
      if (session) {
        await start({ vehicleId: session.vehicleId, campaignId: session.campaignId });
      }
    } else if (activeCampaign && !isTracking) {
      // Start nowej sesji — vehicleId pobieramy z aktywnej sesji lub z kampanii
      // W pełnej implementacji (G.06) będzie ekran wyboru pojazdu
      // Na razie brak startu z dashboardu bez vehicleId
    }
  };

  const statusConfig = {
    idle: { color: '#4A5568', dot: '#4A5568', label: 'Nieaktywne', sub: 'GPS wyłączone' },
    active: { color: '#48BB78', dot: '#48BB78', label: 'Rejestrowanie trasy', sub: 'Trasa jest zapisywana' },
    paused: { color: '#ECC94B', dot: '#ECC94B', label: 'Wstrzymane', sub: 'Rejestrowanie tymczasowo zatrzymane' },
    error: { color: '#FC8181', dot: '#FC8181', label: 'Błąd GPS', sub: error?.message ?? 'Sprawdź uprawnienia lokalizacji' },
  } as const;

  const cfg = statusConfig[status] ?? statusConfig.idle;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <View>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={styles.statusSub}>{cfg.sub}</Text>
          </View>
        </View>

        {status === 'active' && (
          <Pressable
            style={({ pressed }) => [styles.pauseButton, pressed && styles.pauseButtonPressed]}
            onPress={handleToggle}
          >
            <Text style={styles.pauseButtonText}>⏸ Pauza</Text>
          </Pressable>
        )}

        {status === 'paused' && (
          <Pressable
            style={({ pressed }) => [styles.resumeButton, pressed && styles.resumeButtonPressed]}
            onPress={handleToggle}
          >
            <Text style={styles.resumeButtonText}>▶ Wznów</Text>
          </Pressable>
        )}
      </View>

      {isTracking && session && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>
            Sesja aktywna od {formatTime(session.startedAt)}
          </Text>
        </View>
      )}

      {!activeCampaign && status === 'idle' && (
        <Text style={styles.noCampaign}>
          Brak aktywnej kampanii — skontaktuj się z AdRide.
        </Text>
      )}
    </View>
  );
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111720',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2A38',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusSub: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 1,
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  pauseButtonPressed: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  pauseButtonText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  resumeButton: {
    backgroundColor: 'rgba(72, 187, 120, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(72, 187, 120, 0.3)',
  },
  resumeButtonPressed: {
    backgroundColor: 'rgba(72, 187, 120, 0.3)',
  },
  resumeButtonText: {
    color: '#48BB78',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E2A38',
  },
  sessionText: {
    fontSize: 12,
    color: '#718096',
  },
  noCampaign: {
    marginTop: 10,
    fontSize: 12,
    color: '#4A5568',
    fontStyle: 'italic',
  },
});
