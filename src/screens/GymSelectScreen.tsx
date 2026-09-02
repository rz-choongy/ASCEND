import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  ensureSelectedClimbGym,
  getGyms,
  getSelectedClimbGym,
  setSelectedClimbGym,
} from '../domain/gymStore';
import type { GymRow } from '../domain/types';
import { setSessionGymId } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, PressableScale, ScreenHeader, radius, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';

type GymSelectScreenProps = RootStackScreenProps<'GymSelect'>;

const gradingTypeLabel = (gradingType: string): string => {
  switch (gradingType) {
    case 'numeric':
      return 'Numeric grades';
    case 'color':
      return 'Color grades';
    case 'v_scale':
    default:
      return 'V-Scale';
  }
};

export const GymSelectScreen = ({ route, navigation }: GymSelectScreenProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const returnToSessionId = route.params?.returnToSessionId;
  const [allGyms, setAllGyms] = useState<GymRow[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  /** null = root level; string = drilling into a company */
  const [drillParentId, setDrillParentId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const selected = getSelectedClimbGym() ?? ensureSelectedClimbGym();
      setAllGyms(getGyms());
      setSelectedGymId(selected?.id ?? null);
    }, [])
  );

  const rootGyms = useMemo(() => allGyms.filter((g) => !g.parent_id), [allGyms]);
  const drillParent = useMemo(
    () => (drillParentId ? allGyms.find((g) => g.id === drillParentId) ?? null : null),
    [allGyms, drillParentId]
  );
  const branches = useMemo(
    () => (drillParentId ? allGyms.filter((g) => g.parent_id === drillParentId) : []),
    [allGyms, drillParentId]
  );
  const branchCount = useCallback(
    (gymId: string) => allGyms.filter((g) => g.parent_id === gymId).length,
    [allGyms]
  );

  const handleSelectGym = (gymId: string) => {
    if (returnToSessionId) {
      const changed = setSessionGymId(returnToSessionId, gymId);
      if (!changed) {
        Alert.alert(
          'Gym locked for this session',
          'Finish this climbing session before switching gyms. Logged climbs keep their original gym and grade colors.'
        );
        navigation.navigate('ClimbLogger', { sessionId: returnToSessionId });
        return;
      }
      setSelectedClimbGym(gymId);
      navigation.navigate('ClimbLogger', { sessionId: returnToSessionId, gymId });
      return;
    }
    setSelectedClimbGym(gymId);
    navigation.goBack();
  };

  const handleRootGymPress = (gym: GymRow) => {
    const count = branchCount(gym.id);
    if (count > 0) {
      // Drill into this company's branches
      setDrillParentId(gym.id);
    } else {
      handleSelectGym(gym.id);
    }
  };

  // ─── Level 2: inside a company ────────────────────────────────────────────
  if (drillParentId) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader
          eyebrow={drillParent?.name ?? 'Company'}
          title="Select branch"
          onClose={() => navigation.goBack()}
          left={
            <Pressable onPress={() => setDrillParentId(null)} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.backLabel}>All gyms</Text>
            </Pressable>
          }
        />

        <ScrollView contentContainerStyle={styles.content}>
          {branches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No branches yet.</Text>
              <Text style={styles.emptySubText}>Add the first branch below.</Text>
            </View>
          ) : null}
          {branches.map((branch) => {
            const selected = branch.id === selectedGymId;
            return (
              <View key={branch.id} style={[styles.gymCard, selected ? styles.gymCardSelected : null]}>
                <View style={styles.gymHeaderRow}>
                  <View style={styles.gymTextCol}>
                    <Text style={styles.gymName}>{branch.name}</Text>
                    <Text style={styles.gymMeta}>Grades from {drillParent?.name ?? 'company'}</Text>
                  </View>
                  {selected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
                </View>
                <View style={styles.actionButtonsRow}>
                  <PressableScale
                    style={[styles.actionButton, styles.useButton, selected ? styles.useButtonSelected : null]}
                    onPress={() => handleSelectGym(branch.id)}
                    scaleTo={0.96}
                  >
                    <Text style={[styles.actionButtonText, selected ? styles.useButtonTextSelected : null]}>
                      {selected ? 'In use' : 'Use'}
                    </Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate('GymEdit', {
                        returnToSessionId,
                        gymId: branch.id,
                      })
                    }
                    scaleTo={0.96}
                  >
                    <Text style={styles.actionButtonText}>Rename</Text>
                  </PressableScale>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Add Branch"
            onPress={() =>
              navigation.navigate('GymEdit', {
                returnToSessionId,
                parentId: drillParentId,
              })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Level 1: root gyms ───────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        eyebrow="Climbing grades"
        title="Choose gym"
        onClose={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {rootGyms.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No gyms yet — tap Add Gym to create your first.
            </Text>
          </View>
        )}
        {rootGyms.map((gym) => {
          const count = branchCount(gym.id);
          const selected = gym.id === selectedGymId;
          const isCompany = count > 0;
          return (
            <View
              key={gym.id}
              style={[styles.gymCard, selected && !isCompany ? styles.gymCardSelected : null]}
            >
              <View style={styles.gymHeaderRow}>
                <View style={styles.gymTextCol}>
                  <Text style={styles.gymName}>{gym.name}</Text>
                  <Text style={styles.gymMeta}>
                    {isCompany
                      ? `${count} branch${count === 1 ? '' : 'es'}`
                      : gradingTypeLabel(gym.grading_type)}
                  </Text>
                </View>
                {selected && !isCompany ? <Text style={styles.selectedBadge}>Selected</Text> : null}
              </View>
              {isCompany ? (
                <PressableScale
                  style={styles.actionButtonWide}
                  onPress={() => handleRootGymPress(gym)}
                  scaleTo={0.97}
                >
                  <Text style={styles.actionButtonText}>View branches ›</Text>
                </PressableScale>
              ) : (
                <View style={styles.actionButtonsRow}>
                  <PressableScale
                    style={[styles.actionButton, styles.useButton, selected ? styles.useButtonSelected : null]}
                    onPress={() => handleSelectGym(gym.id)}
                    scaleTo={0.96}
                  >
                    <Text style={[styles.actionButtonText, selected ? styles.useButtonTextSelected : null]}>
                      {selected ? 'In use' : 'Use'}
                    </Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate('GymEdit', {
                        returnToSessionId,
                        gymId: gym.id,
                      })
                    }
                    scaleTo={0.96}
                  >
                    <Text style={styles.actionButtonText}>Edit grades</Text>
                  </PressableScale>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Add Gym"
          onPress={() => navigation.navigate('GymEdit', { returnToSessionId })}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backChevron: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  backLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  gymCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  gymCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  gymHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  gymTextCol: {
    flex: 1,
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  gymMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionButtonWide: {
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  useButton: {
    borderColor: colors.accent,
  },
  useButtonSelected: {
    backgroundColor: colors.accent,
  },
  useButtonTextSelected: {
    color: colors.textInverse,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    paddingTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
