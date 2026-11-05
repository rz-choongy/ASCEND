import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  PencilIcon,
  PressableScale,
  CloseIcon,
  font,
  radius,
  showDialog,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

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
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);
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
        showDialog(
          'Gym locked for this session',
          'Finish this climbing session before switching gyms. Logged climbs keep their original gym and grade colors.'
        );
        navigation.popTo('ClimbLogger', { sessionId: returnToSessionId });
        return;
      }
      setSelectedClimbGym(gymId);
      navigation.popTo('ClimbLogger', { sessionId: returnToSessionId, gymId });
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

  const renderHeader = (eyebrow: string, title: string, left?: ReactNode) => (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {left}
        <Text style={styles.eyebrow} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={styles.screenTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <IconButton onPress={() => navigation.goBack()} accessibilityLabel="Close">
        <CloseIcon size={16} color={colors.textPrimary} />
      </IconButton>
    </View>
  );

  // ─── Level 2: inside a company ────────────────────────────────────────────
  if (drillParentId) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        {renderHeader(
          drillParent?.name ?? 'Company',
          'Select branch',
          <Pressable onPress={() => setDrillParentId(null)} style={styles.backButton} hitSlop={10}>
            <ChevronLeftIcon size={14} color={colors.accentInk} strokeWidth={2.4} />
            <Text style={styles.backLabel}>All gyms</Text>
          </Pressable>
        )}

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
                <View style={styles.gymTextCol}>
                  <Text style={styles.gymName}>{branch.name}</Text>
                  <Text style={styles.gymMeta}>Grades from {drillParent?.name ?? 'company'}</Text>
                </View>
                <PressableScale
                  style={[styles.useButton, selected ? styles.useButtonSelected : null]}
                  onPress={() => handleSelectGym(branch.id)}
                  scaleTo={0.96}
                >
                  <Text style={[styles.useButtonText, selected ? styles.useButtonTextSelected : null]}>
                    {selected ? 'In use' : 'Use'}
                  </Text>
                </PressableScale>
                <IconButton
                  size={36}
                  onPress={() =>
                    navigation.navigate('GymEdit', {
                      returnToSessionId,
                      gymId: branch.id,
                    })
                  }
                  accessibilityLabel={`Edit ${branch.name}`}
                >
                  <PencilIcon size={16} color={colors.textSecondary} />
                </IconButton>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Add branch"
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
      {renderHeader('Climbing grades', 'Choose gym')}

      <ScrollView contentContainerStyle={styles.content}>
        {rootGyms.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No gyms yet — tap Add gym to create your first.
            </Text>
          </View>
        )}
        {rootGyms.map((gym) => {
          const count = branchCount(gym.id);
          const selected = gym.id === selectedGymId;
          const isCompany = count > 0;

          if (isCompany) {
            return (
              <PressableScale
                key={gym.id}
                style={styles.gymCard}
                onPress={() => handleRootGymPress(gym)}
                scaleTo={0.98}
              >
                <View style={styles.gymTextCol}>
                  <Text style={styles.gymName}>{gym.name}</Text>
                  <Text style={styles.gymMeta}>{`${count} branch${count === 1 ? '' : 'es'}`}</Text>
                </View>
                {/* Branches inherit the parent's grades and say "edit the parent gym",
                    so the parent needs its own way into the editor. */}
                <IconButton
                  size={36}
                  onPress={() => navigation.navigate('GymEdit', { returnToSessionId, gymId: gym.id })}
                  accessibilityLabel={`Edit ${gym.name}`}
                >
                  <PencilIcon size={16} color={colors.textSecondary} />
                </IconButton>
                <ChevronRightIcon size={16} color={colors.textMuted} />
              </PressableScale>
            );
          }

          return (
            <View key={gym.id} style={[styles.gymCard, selected ? styles.gymCardSelected : null]}>
              <View style={styles.gymTextCol}>
                <Text style={styles.gymName}>{gym.name}</Text>
                <Text style={styles.gymMeta}>{gradingTypeLabel(gym.grading_type)}</Text>
              </View>
              <PressableScale
                style={[styles.useButton, selected ? styles.useButtonSelected : null]}
                onPress={() => handleSelectGym(gym.id)}
                scaleTo={0.96}
              >
                <Text style={[styles.useButtonText, selected ? styles.useButtonTextSelected : null]}>
                  {selected ? 'In use' : 'Use'}
                </Text>
              </PressableScale>
              <IconButton
                size={36}
                onPress={() =>
                  navigation.navigate('GymEdit', {
                    returnToSessionId,
                    gymId: gym.id,
                  })
                }
                accessibilityLabel={`Edit ${gym.name}`}
              >
                <PencilIcon size={16} color={colors.textSecondary} />
              </IconButton>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Add gym"
          onPress={() => navigation.navigate('GymEdit', { returnToSessionId })}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography, shadows: Shadows) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  // Left-aligned display title with its context line above and a close circle on the right.
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s,
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    ...typography.meta,
    marginBottom: 2,
  },
  screenTitle: {
    ...typography.display,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backLabel: {
    color: colors.accentInk,
    fontSize: 15,
    ...font('regular'),
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  gymCardSelected: {
    backgroundColor: colors.accentMuted,
    // A translucent tint over a shadow lets Android draw the elevation
    // through the fill, so tinted cards sit flat.
    elevation: 0,
    shadowOpacity: 0,
  },
  gymTextCol: {
    flex: 1,
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: 15,
    ...font('semibold'),
  },
  gymMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    ...font('regular'),
    marginTop: 2,
  },
  // Pill: soft fill when idle, solid action fill once it's the gym in use.
  useButton: {
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  useButtonSelected: {
    backgroundColor: colors.action,
  },
  useButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    ...font('semibold'),
  },
  useButtonTextSelected: {
    color: colors.onAction,
  },
  emptyCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 14,
    ...font('semibold'),
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: 14,
    ...font('regular'),
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
    ...font('regular'),
    textAlign: 'center',
  },
});
