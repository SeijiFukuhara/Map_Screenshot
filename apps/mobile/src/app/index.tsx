import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceInput } from '@/components/place-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { computeRoutes } from '@/lib/api';
import { useRouteSearch } from '@/lib/route-search-context';
import { Spacing } from '@/constants/theme';

export default function RouteCreateScreen() {
  const router = useRouter();
  const {
    origin,
    destination,
    time,
    searchType,
    setOrigin,
    setDestination,
    setTime,
    setSearchType,
    setOptions,
    swapOriginDestination,
  } = useRouteSearch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!origin || !destination) {
      // Alert.alert()はreact-native-webでは表示されないため、画面内のエラー表示を使う
      setError('出発地と目的地を、候補一覧から選択してください');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await computeRoutes({
        origin,
        destination,
        searchType,
        time: time.toISOString(),
      });
      setOptions(res.routes);
      router.push('/route-select');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ルート検索に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.form}>
        <PlaceInput label="出発地" value={origin} onChange={setOrigin} />

        <Pressable onPress={swapOriginDestination} style={styles.swapButton}>
          <ThemedText>⇅ 入れ替え</ThemedText>
        </Pressable>

        <PlaceInput label="目的地" value={destination} onChange={setDestination} />

        <ThemedView style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, searchType === 'departure' && styles.toggleButtonActive]}
            onPress={() => setSearchType('departure')}
          >
            <ThemedText style={searchType === 'departure' && styles.toggleButtonActiveLabel}>
              出発
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, searchType === 'arrival' && styles.toggleButtonActive]}
            onPress={() => setSearchType('arrival')}
          >
            <ThemedText style={searchType === 'arrival' && styles.toggleButtonActiveLabel}>
              到着
            </ThemedText>
          </Pressable>
        </ThemedView>

        <DateTimePicker
          value={time}
          mode="datetime"
          onChange={(_, selected) => selected && setTime(selected)}
        />

        {error && (
          <ThemedView style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable onPress={handleSearch}>
              <ThemedText type="linkPrimary">再試行</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          <ThemedText style={styles.buttonLabel}>{loading ? '検索中…' : '検索'}</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  swapButton: { alignSelf: 'center', padding: Spacing.two },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggleButton: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  toggleButtonActive: { borderColor: '#1a73e8', backgroundColor: '#e8f0fe' },
  toggleButtonActiveLabel: { color: '#1a73e8' },
  errorBox: { padding: Spacing.three, backgroundColor: '#fdecea', borderRadius: 8, gap: 4 },
  errorText: { color: '#611a15' },
  searchButton: {
    marginTop: 'auto',
    backgroundColor: '#1a73e8',
    padding: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonLabel: { color: '#ffffff' },
});
