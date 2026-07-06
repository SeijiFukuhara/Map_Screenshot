import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createCard } from '@/lib/cards';
import { useRouteSearch } from '@/lib/route-search-context';
import { Spacing } from '@/constants/theme';

const HOSTING_DOMAIN = process.env.EXPO_PUBLIC_HOSTING_DOMAIN ?? 'https://routecard.example.com';
const MEMO_MAX_LENGTH = 200;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = `${d.getMonth() + 1}/${d.getDate()}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export default function CardEditScreen() {
  const router = useRouter();
  const { origin, destination, selected, setSelected } = useRouteSearch();
  const [memo, setMemo] = useState('');
  const [sharing, setSharing] = useState(false);

  if (!origin || !destination || !selected) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText style={styles.empty}>ルートが選択されていません</ThemedText>
      </SafeAreaView>
    );
  }

  const dep = formatDateTime(selected.departureTime);
  const arr = formatDateTime(selected.arrivalTime);
  const transitLine = selected.legs.find((leg) => leg.mode === 'TRANSIT')?.lineName ?? '';

  async function handleShare() {
    setSharing(true);
    try {
      const cardId = await createCard({ origin: origin!, destination: destination!, route: selected!, memo });
      const url = `${HOSTING_DOMAIN}/r/${cardId}`;
      const text = `【${dep.date} ${origin!.name} → ${destination!.name}】\n${dep.time}発 → ${arr.time}着（${transitLine}・乗換${selected!.transferCount}回）${
        memo ? `\nメモ: ${memo}` : ''
      }\n${url}`;
      await Share.share({ message: text });
      setSelected(null);
      router.replace('/history');
    } catch (e) {
      Alert.alert('共有に失敗しました', e instanceof Error ? e.message : String(e));
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.form}>
        <ThemedView type="backgroundElement" style={styles.preview}>
          <ThemedText type="smallBold">
            {dep.date} {origin.name} → {destination.name}
          </ThemedText>
          <ThemedText>
            {dep.time}発 → {arr.time}着（{transitLine}・乗換{selected.transferCount}回）
          </ThemedText>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          メモ（{memo.length}/{MEMO_MAX_LENGTH}）
        </ThemedText>
        <TextInput
          value={memo}
          onChangeText={(t) => setMemo(t.slice(0, MEMO_MAX_LENGTH))}
          placeholder="例: 北改札前に9:00集合"
          multiline
          style={styles.memoInput}
        />

        <Pressable style={styles.shareButton} onPress={handleShare} disabled={sharing}>
          <ThemedText themeColor="background">{sharing ? '共有準備中…' : '共有する'}</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  preview: { padding: Spacing.three, borderRadius: 8, gap: 4 },
  memoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: Spacing.two,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  shareButton: {
    marginTop: 'auto',
    backgroundColor: '#1a73e8',
    padding: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
  },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
