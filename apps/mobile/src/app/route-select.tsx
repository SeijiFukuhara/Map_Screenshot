import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RouteOption } from '@routecard/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouteSearch } from '@/lib/route-search-context';
import { Spacing } from '@/constants/theme';

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function RouteOptionCard({
  option,
  expanded,
  onToggle,
  onSelect,
}: {
  option: RouteOption;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const firstTransitLine = option.legs.find((leg) => leg.mode === 'TRANSIT')?.lineName;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable onPress={onToggle}>
        <ThemedText type="smallBold">
          {formatTime(option.departureTime)}発 → {formatTime(option.arrivalTime)}着
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {firstTransitLine ?? '経路'} ほか ／ 乗換{option.transferCount}回
          {option.fare != null ? ` ／ ¥${option.fare}` : ''}
        </ThemedText>
      </Pressable>

      {expanded && (
        <ThemedView style={styles.legList}>
          {option.legs.map((leg, i) =>
            leg.mode === 'WALK' ? (
              <ThemedText key={i} type="small" themeColor="textSecondary">
                徒歩 {leg.durationMinutes}分
              </ThemedText>
            ) : (
              <ThemedText key={i} type="small">
                {formatTime(leg.depTime)} {leg.depStop} → {leg.lineName}
                {leg.headsign ? `（${leg.headsign}行）` : ''} → {formatTime(leg.arrTime)}{' '}
                {leg.arrStop}
              </ThemedText>
            )
          )}
        </ThemedView>
      )}

      <Pressable style={styles.selectButton} onPress={onSelect}>
        <ThemedText style={styles.buttonLabel}>このルートでカードを作る</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export default function RouteSelectScreen() {
  const router = useRouter();
  const { options, setSelected } = useRouteSearch();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function handleSelect(option: RouteOption) {
    setSelected(option);
    router.push('/card-edit');
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.list}
        data={options.slice(0, 5)}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <RouteOptionCard
            option={item}
            expanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            onSelect={() => handleSelect(item)}
          />
        )}
        ListEmptyComponent={<ThemedText style={styles.empty}>候補がありません</ThemedText>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.four, gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: 8, gap: Spacing.two },
  legList: { gap: 4, marginTop: Spacing.two },
  selectButton: {
    marginTop: Spacing.two,
    backgroundColor: '#1a73e8',
    padding: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonLabel: { color: '#ffffff' },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
