// WAŻNE: GPS background task musi być zarejestrowany przed jakimkolwiek renderowaniem.
// Import poniżej jest side-effectem — wywołuje TaskManager.defineTask().
import 'src/modules/gps-tracking';

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#FF6B35',
            background: '#0A0D12',
            card: '#111720',
            text: '#E6EDF3',
            border: '#1E2A38',
            notification: '#FF6B35',
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '900' },
          },
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
