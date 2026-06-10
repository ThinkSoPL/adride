import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProofGalleryScreen } from '../screens/ProofGalleryScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0D12' },
        headerTintColor: '#E6EDF3',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'AdRide' }}
      />
      <Stack.Screen
        name="ProofGallery"
        component={ProofGalleryScreen}
        options={{ title: 'Zdjęcia dowodowe' }}
      />
    </Stack.Navigator>
  );
}
