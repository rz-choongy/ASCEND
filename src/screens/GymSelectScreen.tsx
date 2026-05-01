import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ensureSelectedClimbGym,
  getGyms,
  getSelectedClimbGym,
  setSelectedClimbGym,
} from '../domain/gymStore';
import { setSessionGymId } from '../domain/sessionStore';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, colors, radius, spacing, typography } from '../ui';

type GymSelectScreenProps = RootStackScreenProps<'GymSelect'>;

type GymLike = {
  id: string;
  name: string;
  gradingType?: string;
};

const normalizeGym = (gym: unknown): GymLike | null => {
  if (!gym || typeof gym !== 'object') return null;
  const value = gym as {
    id?: unknown;
    name?: unknown;
    gradingType?: unknown;
    grading_type?: unknown;
  };
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  const gradingType = value.gradingType ?? value.grading_type;
  return {
    id: value.id,
    name: value.name,
    gradingType: typeof gradingType === 'string' ? gradingType : undefined,
  };
};

const gradingTypeLabel = (gradingType?: string): string => {
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
  const [gyms, setGyms] = useState<GymLike[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const selected = normalizeGym(getSelectedClimbGym() ?? ensureSelectedClimbGym());
      const nextGyms = getGyms()
        .map(normalizeGym)
        .filter((gym): gym is GymLike => gym !== null);
      setGyms(nextGyms);
      setSelectedGymId(selected?.id ?? null);
    }, [])
  );

  const handleSelect = (gym: GymLike) => {
    if (returnToSessionId) {
      const changed = setSessionGymId(returnToSessionId, gym.id);
      if (!changed) {
        Alert.alert(
          'Gym locked for this session',
          'Finish this climbing session before switching gyms. Logged climbs keep their original gym and grade colors.'
        );
        navigation.navigate('ClimbLogger', { sessionId: returnToSessionId });
        return;
      }
      setSelectedClimbGym(gym.id);
      navigation.navigate('ClimbLogger', {
        sessionId: returnToSessionId,
        gymId: gym.id,
      });
      return;
    }
    setSelectedClimbGym(gym.id);
    navigation.goBack();
  };

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
        {gyms.map((gym) => {
          const selected = gym.id === selectedGymId;
          return (
            <Pressable
              key={gym.id}
              style={[styles.gymRow, selected ? styles.gymRowSelected : null]}
              onPress={() => handleSelect(gym)}
            >
              <View style={styles.gymTextCol}>
                <Text style={styles.gymName}>{gym.name}</Text>
                <Text style={styles.gymMeta}>{gradingTypeLabel(gym.gradingType)}</Text>
              </View>
              <View style={styles.actionCol}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  actionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  editText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    paddingTop: spacing.xs,
  },
});
