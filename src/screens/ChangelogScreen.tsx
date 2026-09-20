import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_VERSION, CHANGELOG, type ChangeKind } from '../changelog';
import { formatMonthDay } from '../domain/strengthProgress';
import type { RootStackScreenProps } from '../navigation/types';
import { ChevronLeftIcon, IconButton, radius, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const KIND_LABEL: Record<ChangeKind, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
};

/** Local noon, so a plain YYYY-MM-DD never slips a day across a timezone boundary. */
const formatEntryDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${formatMonthDay(new Date(year, month - 1, day, 12).getTime())}, ${year}`;
};

export const ChangelogScreen = ({ navigation }: RootStackScreenProps<'Changelog'>) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const kindColor = (kind: ChangeKind): string =>
    kind === 'fixed' ? colors.success : kind === 'new' ? colors.accent : colors.textSecondary;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton
          variant="bare"
          size={36}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <ChevronLeftIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />
        </IconButton>
        <Text style={styles.title}>What's new</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {CHANGELOG.map((entry) => (
          <View key={entry.version} style={styles.entry}>
            <View style={styles.entryHeader}>
              <Text style={styles.version}>{entry.version}</Text>
              {entry.version === APP_VERSION ? (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              ) : null}
              <Text style={styles.date}>{formatEntryDate(entry.date)}</Text>
            </View>

            <View style={styles.card}>
              {entry.changes.map((change, index) => (
                <View key={index} style={[styles.row, index > 0 ? styles.rowBordered : null]}>
                  <Text style={[styles.kind, { color: kindColor(change.kind) }]}>
                    {KIND_LABEL[change.kind]}
                  </Text>
                  <Text style={styles.text}>{change.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
    },
    title: {
      ...typography.title,
      fontSize: 20,
    },
    content: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    entry: {
      gap: spacing.xs,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
      marginLeft: spacing.xs,
    },
    version: {
      ...typography.numeric,
      fontSize: 22,
    },
    currentBadge: {
      backgroundColor: colors.accentMuted,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
      alignSelf: 'center',
    },
    currentBadgeText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    date: {
      ...typography.meta,
      fontSize: 13,
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.s,
    },
    row: {
      paddingVertical: spacing.s,
      gap: 3,
    },
    rowBordered: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    kind: {
      ...typography.section,
      fontWeight: '700',
    },
    text: {
      ...typography.body,
      fontWeight: '400',
      lineHeight: 22,
    },
  });
