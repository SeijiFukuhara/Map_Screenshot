import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import type { Place } from '@routecard/shared';

import { placesAutocomplete } from '@/lib/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

interface Suggestion {
  placeId: string;
  description: string;
}

interface PlaceInputProps {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
}

function newSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function PlaceInput({ label, value, onChange }: PlaceInputProps) {
  const theme = useTheme();
  const [text, setText] = useState(value?.name ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const sessionTokenRef = useRef(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChangeText(nextText: string) {
    setText(nextText);
    onChange(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (nextText.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await placesAutocomplete({
          input: nextText,
          sessionToken: sessionTokenRef.current,
        });
        setSuggestions(res.suggestions);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function handleSelect(suggestion: Suggestion) {
    setText(suggestion.description);
    setSuggestions([]);
    // 選択確定でセッショントークンを使い切るため、次回入力用に新しいトークンを発行する
    sessionTokenRef.current = newSessionToken();
    onChange({ name: suggestion.description, placeId: suggestion.placeId });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        placeholder={`${label}を入力`}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
      />
      {suggestions.length > 0 && (
        <FlatList
          style={[
            styles.suggestions,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.suggestionRow, { borderBottomColor: theme.backgroundSelected }]}
              onPress={() => handleSelect(item)}
            >
              <ThemedText>{item.description}</ThemedText>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  suggestions: {
    maxHeight: 160,
    borderWidth: 1,
    borderRadius: 8,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
