import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteCard } from '@routecard/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { deleteCard, listMyCards } from '@/lib/cards';
import { useRouteSearch } from '@/lib/route-search-context';
import { Spacing } from '@/constants/theme';

const HOSTING_DOMAIN = process.env.EXPO_PUBLIC_HOSTING_DOMAIN ?? 'https://routecard.example.com';

type CardWithId = RouteCard & { id: string };

function isPast(card: CardWithId): boolean {
  return new Date(card.departureTime).getTime() < Date.now();
}

export default function HistoryScreen() {
  const router = useRouter();
  const { setOrigin, setDestination, setTime, setSearchType } = useRouteSearch();
  const [cards, setCards] = useState<CardWithId[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setCards(await listMyCards());
    } catch (e) {
      Alert.alert('履歴の取得に失敗しました', e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleReshare(card: CardWithId) {
    const url = `${HOSTING_DOMAIN}/r/${card.id}`;
    await Share.share({ message: url });
  }

  function handleDuplicate(card: CardWithId) {
    setOrigin(card.origin);
    setDestination(card.destination);
    setSearchType(card.searchType);
    setTime(new Date());
    router.push('/');
  }

  function handleDelete(card: CardWithId) {
    Alert.alert('このカードを削除しますか？', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteCard(card.id);
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.list}
        data={cards}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => {
          const dep = new Date(item.departureTime);
          const past = isPast(item);
          return (
            <ThemedView type="backgroundElement" style={[styles.card, past && styles.cardPast]}>
              <ThemedText type="smallBold">
                {dep.getMonth() + 1}/{dep.getDate()} {item.origin.name} → {item.destination.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {String(dep.getHours()).padStart(2, '0')}:{String(dep.getMinutes()).padStart(2, '0')}発
              </ThemedText>
              <ThemedView style={styles.actionRow}>
                <Pressable onPress={() => handleReshare(item)}>
                  <ThemedText type="linkPrimary">再共有</ThemedText>
                </Pressable>
                <Pressable onPress={() => handleDuplicate(item)}>
                  <ThemedText type="linkPrimary">複製</ThemedText>
                </Pressable>
                <Pressable onPress={() => handleDelete(item)}>
                  <ThemedText type="linkPrimary">削除</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          );
        }}
        ListEmptyComponent={<ThemedText style={styles.empty}>作成したカードはまだありません</ThemedText>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.four, gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: 8, gap: 4 },
  cardPast: { opacity: 0.5 },
  actionRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
