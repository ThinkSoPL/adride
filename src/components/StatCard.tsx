import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}

export function StatCard({ label, value, unit, accent = false }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#111720',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2A38',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  valueAccent: {
    color: '#FF6B35',
  },
  unit: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
});
