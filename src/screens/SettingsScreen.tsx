import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ensureSelectedClimbGym, getSelectedClimbGym } from '../domain/gymStore';
import { getShowSessionTimer, setShowSessionTimer } from '../domain/settingsStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  ACCENT_PALETTE,
  ChevronLeftIcon,
  ListRow,
  MountainMarkIcon,
  PressableScale,
  spacing,
  useTheme,
} from '../ui';
import type { AccentColorId, ThemeColors, ThemeMode } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const ACCENT_OPTIONS = Object.entries(ACCENT_PALETTE) as [AccentColorId, (typeof ACCENT_PALETTE)[AccentColorId]][];

type SettingsScreenProps = RootStackScreenProps<'Settings'>;

// Bumped by hand with each shipped round of changes (major.minor only, no
// patch digit). Deliberately separate from app.json's "version" field, which
// drives EAS's runtimeVersion (policy: "appVersion") -- bumping that would
// break OTA updates for already-installed builds, since it changes what
// runtime an `eas update` targets.
const APP_VERSION = '1.6';

export const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { colors, typography, mode, setMode, accentId, setAccentId } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const [gymName, setGymName] = useState('Default V-Scale');
  const [timerEnabled, setTimerEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const gym = getSelectedClimbGym() ?? ensureSelectedClimbGym();
      setGymName(gym.name);
      setTimerEnabled(getShowSessionTimer());
    }, [])
  );

  const handleToggleTimer = (value: boolean) => {
    setTimerEnabled(value);
    setShowSessionTimer(value);
  };

  const setThemeMode = (next: ThemeMode) => {
    if (next !== mode) setMode(next);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={8}>
          <ChevronLeftIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />
        </PressableScale>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
          <ListRow
            title="Theme"
            right={
              // Deliberately pill-shaped -- Direction A's wireframe carves this
              // control out as the one intentional exception to its otherwise
              // fully-sharp corner language.
              <View style={styles.pillSegmented}>
                <TouchableOpacity
                  style={[styles.pillSeg, mode === 'light' && styles.pillSegActive]}
                  onPress={() => setThemeMode('light')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillSegText, mode === 'light' && styles.pillSegTextActive]}>
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillSeg, mode === 'dark' && styles.pillSegActive]}
                  onPress={() => setThemeMode('dark')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillSegText, mode === 'dark' && styles.pillSegTextActive]}>
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
          <ListRow
            title="Accent color"
            subtitle="Used for buttons, selection, and highlights"
            right={
              <View style={styles.accentSwatchRow}>
                {ACCENT_OPTIONS.map(([id, option]) => {
                  const selected = id === accentId;
                  const swatchColor = option[mode].accent;
                  return (
                    <PressableScale
                      key={id}
                      onPress={() => setAccentId(id)}
                      scaleTo={0.9}
                      hitSlop={6}
                      accessibilityLabel={option.label}
                      style={[
                        styles.accentSwatch,
                        { backgroundColor: swatchColor },
                        selected ? styles.accentSwatchSelected : null,
                      ]}
                    />
                  );
                })}
              </View>
            }
          />
        </View>

        <Text style={styles.sectionLabel}>Session</Text>
        <View style={styles.group}>
          <ListRow
            title="Default gym"
            subtitle="Used to prefill new climbing sessions"
            meta={gymName}
            onPress={() => navigation.navigate('GymSelect')}
          />
          <ListRow
            title="Session timer"
            subtitle="Show elapsed time while logging"
            right={
              <Switch
                value={timerEnabled}
                onValueChange={handleToggleTimer}
                trackColor={{ false: colors.borderSoft, true: colors.accent }}
                thumbColor="#ffffff"
              />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <ListRow title="Version" meta={APP_VERSION} />
        </View>

        <View style={styles.footer}>
          <MountainMarkIcon size={18} color={colors.accent} strokeWidth={2} />
          <Text style={styles.footerWord}>ASCEND</Text>
        </View>
      </View>
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
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.title,
      fontSize: 20,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    sectionLabel: {
      ...typography.section,
      marginBottom: spacing.xs,
    },
    group: {},

    pillSegmented: {
      flexDirection: 'row',
      gap: 2,
      borderWidth: 1,
      borderColor: colors.textMuted,
      padding: 2,
      borderRadius: 13,
      marginTop: 4,
    },
    pillSeg: {
      paddingHorizontal: 12,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
    },
    pillSegActive: {
      backgroundColor: colors.accent,
    },
    pillSegText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    pillSegTextActive: {
      color: colors.textInverse,
    },

    accentSwatchRow: {
      flexDirection: 'row',
      gap: spacing.xxs,
      marginTop: 4,
    },
    accentSwatch: {
      width: 24,
      height: 24,
      borderRadius: 0,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    accentSwatchSelected: {
      borderColor: colors.textPrimary,
    },

    footer: {
      alignItems: 'center',
      gap: 6,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    footerWord: {
      ...typography.title,
      fontSize: 13,
      letterSpacing: 0.2,
      color: colors.textSecondary,
    },
  });
