import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

export function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobierz istniejącą sesję przy starcie
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    // Nasłuchuj zmian stanu auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0D12' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return session ? <AppStack /> : <AuthStack />;
}
