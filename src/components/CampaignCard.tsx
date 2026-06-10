import { StyleSheet, Text, View } from 'react-native';
import type { ActiveCampaign } from '../lib/queries-mobile';

interface CampaignCardProps {
  campaign: ActiveCampaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = Math.min(
    1,
    campaign.minKmMonthly > 0 ? campaign.kmThisMonth / campaign.minKmMonthly : 0,
  );
  const percent = Math.round(progress * 100);
  const remaining = Math.max(0, campaign.minKmMonthly - campaign.kmThisMonth);
  const guaranteed = progress >= 1;

  const endDateLabel = campaign.endDate
    ? `Do ${new Date(campaign.endDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, guaranteed ? styles.badgeGreen : styles.badgeOrange]}>
            <Text style={[styles.badgeText, guaranteed ? styles.badgeTextGreen : styles.badgeTextOrange]}>
              {guaranteed ? '✓ Gwarancja km' : 'W trakcie'}
            </Text>
          </View>
        </View>
        {endDateLabel && <Text style={styles.endDate}>{endDateLabel}</Text>}
      </View>

      <Text style={styles.campaignName} numberOfLines={1}>{campaign.name}</Text>

      {/* Pasek postępu km */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%` as `${number}%` },
              guaranteed && styles.progressFillGreen,
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressKm}>
            {campaign.kmThisMonth.toFixed(1)} km
          </Text>
          <Text style={styles.progressTarget}>
            cel: {campaign.minKmMonthly} km
          </Text>
        </View>
      </View>

      {!guaranteed && (
        <Text style={styles.remaining}>
          Jeszcze <Text style={styles.remainingAccent}>{remaining.toFixed(0)} km</Text> do progu gwarancji
        </Text>
      )}
    </View>
  );
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeOrange: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderColor: 'rgba(255,107,53,0.3)',
  },
  badgeGreen: {
    backgroundColor: 'rgba(72,187,120,0.12)',
    borderColor: 'rgba(72,187,120,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextOrange: { color: '#FF6B35' },
  badgeTextGreen: { color: '#48BB78' },
  endDate: {
    fontSize: 12,
    color: '#4A5568',
  },
  campaignName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 14,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1E2A38',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  progressFillGreen: {
    backgroundColor: '#48BB78',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressKm: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  progressTarget: {
    fontSize: 12,
    color: '#4A5568',
  },
  remaining: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  remainingAccent: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});
