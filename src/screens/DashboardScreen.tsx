import { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../lib/auth';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/StatCard';
import { TrackingCard } from '../components/TrackingCard';
import { CampaignCard } from '../components/CampaignCard';
import { SessionItem } from '../components/SessionItem';
import type { DashboardScreenProps, AppStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SessionSummary } from '../lib/queries-mobile';

export function DashboardScreen(_props: DashboardScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data, loading, error, refresh } = useDashboard();

  // Przycisk wylogowania w headerze
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={async () => { await signOut(); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginRight: 4 })}
          hitSlop={8}
        >
          <Text style={styles.logoutBtn}>Wyloguj</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  const firstName = data?.profile.fullName.split(' ')[0] ?? 'Kierowco';
  const driverStatusConfig = getDriverStatusConfig(data?.profile.status);

  const renderSession = useCallback(
    ({ item }: { item: SessionSummary }) => <SessionItem session={item} />,
    [],
  );

  const keyExtractor = useCallback((item: SessionSummary) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Powitanie + status kierowcy */}
        <View style={styles.heroSection}>
          <View>
            <Text style={styles.greeting}>Cześć, {firstName}!</Text>
            <Text style={styles.greetingSub}>
              {new Date().toLocaleDateString('pl-PL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: driverStatusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: driverStatusConfig.dot }]} />
            <Text style={[styles.statusText, { color: driverStatusConfig.color }]}>
              {driverStatusConfig.label}
            </Text>
          </View>
        </View>

        {/* Statystyki miesięczne */}
        <View style={styles.statsRow}>
          <StatCard
            label="Km tego miesiąca"
            value={data?.monthlyStats.totalKm.toFixed(1) ?? '—'}
            unit="km"
            accent
          />
          <View style={styles.statGap} />
          <StatCard
            label="Zarobki"
            value={
              data ? formatPLN(data.earningsPLN) : '—'
            }
            unit={data && data.earningsPLN > 0 ? 'PLN' : ''}
          />
          <View style={styles.statGap} />
          <StatCard
            label="Dni aktywne"
            value={String(data?.monthlyStats.daysActive ?? '—')}
          />
        </View>

        {/* Status GPS trackingu */}
        <SectionTitle title="Rejestrowanie trasy" />
        <TrackingCard activeCampaign={data?.activeCampaign ?? null} />

        {/* Aktywna kampania */}
        {data?.activeCampaign && (
          <>
            <SectionTitle title="Twoja kampania" />
            <CampaignCard campaign={data.activeCampaign} />
          </>
        )}

        {/* Ostatnie przejazdy */}
        <SectionTitle title="Ostatnie przejazdy" />
        {data?.recentSessions && data.recentSessions.length > 0 ? (
          <View style={styles.sessionsCard}>
            <FlatList
              data={data.recentSessions}
              renderItem={renderSession}
              keyExtractor={keyExtractor}
              scrollEnabled={false}
              ListFooterComponent={
                data.recentSessions.length >= 10 ? (
                  <Text style={styles.seeMore}>
                    Pokaż wszystkie przejazdy →
                  </Text>
                ) : null
              }
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Brak zarejestrowanych przejazdów</Text>
            <Text style={styles.emptySubText}>
              Uruchom aplikację podczas jazdy, aby zacząć rejestrować trasy.
            </Text>
          </View>
        )}

        {/* Padding dolny */}
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function formatPLN(value: number): string {
  if (value === 0) return '0';
  return value.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getDriverStatusConfig(status?: string) {
  switch (status) {
    case 'active':
      return { label: 'Aktywny', color: '#48BB78', dot: '#48BB78', bg: 'rgba(72,187,120,0.12)' };
    case 'approved':
      return { label: 'Zatwierdzony', color: '#63B3ED', dot: '#63B3ED', bg: 'rgba(99,179,237,0.12)' };
    case 'paused':
      return { label: 'Wstrzymany', color: '#ECC94B', dot: '#ECC94B', bg: 'rgba(236,201,75,0.12)' };
    case 'pending':
      return { label: 'Oczekuje', color: '#718096', dot: '#718096', bg: 'rgba(113,128,150,0.12)' };
    case 'rejected':
      return { label: 'Odrzucony', color: '#FC8181', dot: '#FC8181', bg: 'rgba(252,129,129,0.12)' };
    default:
      return { label: '—', color: '#4A5568', dot: '#4A5568', bg: 'rgba(74,85,104,0.12)' };
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D12',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0D12',
    padding: 24,
  },
  errorText: {
    color: '#FC8181',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1E2A38',
    borderRadius: 8,
  },
  retryText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  logoutBtn: {
    color: '#718096',
    fontSize: 14,
  },

  // Hero
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E6EDF3',
  },
  greetingSub: {
    fontSize: 13,
    color: '#4A5568',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  statGap: {
    width: 8,
  },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 10,
  },

  // Sessions
  sessionsCard: {
    backgroundColor: '#111720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2A38',
    paddingHorizontal: 12,
  },
  seeMore: {
    textAlign: 'center',
    color: '#FF6B35',
    fontSize: 13,
    paddingVertical: 14,
  },
  emptyCard: {
    backgroundColor: '#111720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2A38',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptySubText: {
    color: '#4A5568',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  bottomPad: {
    height: 32,
  },
});
