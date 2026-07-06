import { DarkTheme, DefaultTheme, Link, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { RouteSearchProvider } from '@/lib/route-search-context';
import { ThemedText } from '@/components/themed-text';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RouteSearchProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: 'ルート作成',
              headerRight: () => (
                <Link href="/history">
                  <ThemedText themeColor="text">履歴</ThemedText>
                </Link>
              ),
            }}
          />
          <Stack.Screen name="route-select" options={{ title: 'ルート選択' }} />
          <Stack.Screen name="card-edit" options={{ title: 'カード編集・共有' }} />
          <Stack.Screen name="history" options={{ title: '履歴' }} />
        </Stack>
      </RouteSearchProvider>
    </ThemeProvider>
  );
}
