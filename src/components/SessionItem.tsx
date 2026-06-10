import { StyleSheet, Text, View } from 'react-native';
import type { SessionSummary } from '../lib/queries-mobile';

interface SessionItemProps {
  session: SessionSummary;
}

export function SessionItem({ session }: SessionItemProps) {
  const date = new Date(session.startedAt);
  const dateLabel = date.toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeLabel = date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const duration = session.endedAt
    ? formatDuration(
        (new Date(session.endedAt).getTime() - date.getTime()) / 1000,
      )
    : '(aktywna)';

  return (
    <View style={styles.row}>
      <View style={styles.dateCol}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <Text style={styles.timeLabel}>{timeLabel}</Text>
      </View>

      <View style={styles.statsCol}>
        <Text style={styles.km}>{session.totalKm.toFixed(1)} km</Text>
        {session.avgSpeedKmh !== null && (
          <Text style={styles.speed}>⌀ {session.avgSpeedKmh.toFixed(0)} km/h</Text>
        )}
      </View>

      <View style={styles.rightCol}>
        <Text style={styles.duration}>{duration}</Text>
        {session.campaignName && (
          <Text style={styles.campaign} numberOfLines={1}>
            {session.campaignName}
          </Text>
        )}
      </View>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2230',
    gap: 12,
  },
  dateCol: {
    width: 80,
  },
  dateLabel: {
    fontSize: 13,
    color: '#E6EDF3',
    fontWeight: '500',
  },
  timeLabel: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 2,
  },
  statsCol: {
    flex: 1,
  },
  km: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B35',
  },
  speed: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  duration: {
    fontSize: 13,
    color: '#718096',
  },
  campaign: {
    fontSize: 11,
    color: '#4A5568',
    marginTop: 2,
    maxWidth: 90,
  },
});
