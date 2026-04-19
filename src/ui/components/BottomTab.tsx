import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';

type TabItem = {
  key: string;
  label: string;
};

type BottomTabProps = {
  items: TabItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export const BottomTab = ({ items, selectedKey, onSelect }: BottomTabProps) => {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.key === selectedKey;
        return (
          <Pressable
            key={item.key}
            style={[styles.tab, active ? styles.tabActive : null]}
            onPress={() => onSelect(item.key)}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{item.label}</Text>
            {active ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelActive: {
    color: colors.textPrimary,
  },
  indicator: {
    marginTop: 6,
    height: 3,
    width: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
