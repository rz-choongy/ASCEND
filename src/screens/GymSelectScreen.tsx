import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Button, colors, radius, spacing, typography } from '../ui';

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
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => setDrillParentId(null)} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.backLabel}>All gyms</Text>
            </Pressable>
            <Text style={styles.eyebrow}>{drillParent?.name ?? 'Company'}</Text>
            <Text style={styles.title}>Select branch</Text>
          </View>
          <Button
            label="Close"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            textStyle={styles.closeText}
          />
        </View>

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
              <Pressable
                key={branch.id}
                style={[styles.gymRow, selected ? styles.gymRowSelected : null]}
                onPress={() => handleSelectGym(branch.id)}
              >
                <View style={styles.gymTextCol}>
                  <Text style={styles.gymName}>{branch.name}</Text>
                  <Text style={styles.gymMeta}>
                    Grades from {drillParent?.name ?? 'company'}
                  </Text>
                </View>
                <View style={styles.actionCol}>
                  <Text style={[styles.selectText, selected ? styles.selectTextActive : null]}>
                    {selected ? 'Selected' : 'Use'}
                  </Text>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('GymEdit', {
                        returnToSessionId,
                        gymId: branch.id,
                      })
                    }
                    hitSlop={10}
                  >
                    <Text style={styles.editText}>Rename</Text>
                  </Pressable>
                </View>
              </Pressable>
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
      </View>
    );
  }

  // ─── Level 1: root gyms ───────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Climbing grades</Text>
          <Text style={styles.title}>Choose gym</Text>
        </View>
        <Button
          label="Close"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          textStyle={styles.closeText}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rootGyms.map((gym) => {
          const count = branchCount(gym.id);
          const selected = gym.id === selectedGymId;
          const isCompany = count > 0;
          return (
            <Pressable
              key={gym.id}
              style={[styles.gymRow, selected && !isCompany ? styles.gymRowSelected : null]}
              onPress={() => handleRootGymPress(gym)}
            >
              <View style={styles.gymTextCol}>
                <Text style={styles.gymName}>{gym.name}</Text>
                <Text style={styles.gymMeta}>
                  {isCompany
                    ? `${count} branch${count === 1 ? '' : 'es'}`
                    : gradingTypeLabel(gym.grading_type)}
                </Text>
              </View>
              <View style={styles.actionCol}>
                {isCompany ? (
                  <Text style={styles.drillText}>Branches ›</Text>
                ) : (
                  <>
                    <Text style={[styles.selectText, selected ? styles.selectTextActive : null]}>
                      {selected ? 'Selected' : 'Use'}
                    </Text>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('GymEdit', {
                          returnToSessionId,
                          gymId: gym.id,
                        })
                      }
                      hitSlop={10}
                    >
                      <Text style={styles.editText}>Edit grades</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Add Gym"
          onPress={() => navigation.navigate('GymEdit', { returnToSessionId })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
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
  eyebrow: {
    ...typography.meta,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    marginTop: 2,
  },
  closeButton: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  closeText: {
    fontSize: 10,
  },
  content: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  gymRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
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
  actionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  selectText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  selectTextActive: {
    color: colors.accent,
  },
  drillText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  editText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
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
});
