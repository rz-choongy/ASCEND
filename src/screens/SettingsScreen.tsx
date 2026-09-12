import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import { ensureSelectedClimbGym, getSelectedClimbGym } from '../domain/gymStore';
import {
  countWideGradeBandClimbs,
  narrowWideGradeBands,
  type WideBandSummary,
} from '../domain/sessionStore';
import { getShowSessionTimer, setShowSessionTimer } from '../domain/settingsStore';
import type { RootStackScreenProps } from '../navigation/types';
import {
  ACCENT_PALETTE,
  ChevronLeftIcon,
  IconButton,
  ListRow,
  MountainMarkIcon,
  PressableScale,
  radius,
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
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [wideBands, setWideBands] = useState<WideBandSummary>({ sessions: 0, climbs: 0 });

  useFocusEffect(
    useCallback(() => {
      const gym = getSelectedClimbGym() ?? ensureSelectedClimbGym();
      setGymName(gym.name);
      setTimerEnabled(getShowSessionTimer());
      setWideBands(countWideGradeBandClimbs());
    }, [])
  );

  const handleToggleTimer = (value: boolean) => {
    setTimerEnabled(value);
    setShowSessionTimer(value);
  };

  // Publishing an OTA update only makes it available for download - by default the app
  // downloads it in the background on launch but keeps running the old JS until the
  // *next* cold start, so "did it update?" is otherwise a guessing game. This lets
  // people fetch + apply immediately instead of force-quitting the app twice.
  const handleCheckForUpdates = async () => {
    if (isCheckingUpdate) return;
    if (!Updates.isEnabled) {
      Alert.alert(
        'Updates unavailable',
        "This build doesn't support over-the-air updates (e.g. Expo Go or a local dev build)."
      );
      return;
    }
    setIsCheckingUpdate(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert('Up to date', "You're already on the latest version.");
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Update ready', 'Restart now to apply it?', [
        { text: 'Later', style: 'cancel' },
        { text: 'Restart', onPress: () => void Updates.reloadAsync() },
      ]);
    } catch (e) {
      Alert.alert("Couldn't check for updates", e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const setThemeMode = (next: ThemeMode) => {
    if (next !== mode) setMode(next);
  };

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const handleRefineGrades = () => {
    // Always give the tap some feedback -- a silent no-op here is indistinguishable
    // from the button being broken, which is exactly what it looked like before this.
    if (wideBands.climbs === 0) {
      Alert.alert('Nothing to refine', 'Every logged climb already has an exact grade.');
      return;
    }
    Alert.alert(
      'Refine old grade ranges?',
      `${plural(wideBands.climbs, 'climb')} across ${plural(wideBands.sessions, 'session')} ` +
        'were logged as a range, like V4–V6. This sets each one to the middle grade so they ' +
        'pool correctly in Progress.\n\n' +
        "It's an estimate, not what you actually climbed — your original entries stay on " +
        'record as corrections rather than being overwritten.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refine',
          onPress: () => {
            const done = narrowWideGradeBands();
            setWideBands(countWideGradeBandClimbs());
            Alert.alert('Grades refined', `Updated ${plural(done.climbs, 'climb')}.`);
          },
        },
      ]
    );
  };

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
            subtitle="Show elapsed time in climbing sessions"
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

        <Text style={styles.sectionLabel}>Data</Text>
        <View style={styles.group}>
          <ListRow
            title="Refine old grade ranges"
            subtitle={
              wideBands.climbs > 0
                ? 'Set range-graded climbs to their middle grade'
                : 'Every logged climb already has an exact grade'
            }
            meta={wideBands.climbs > 0 ? `${wideBands.climbs}` : undefined}
            onPress={handleRefineGrades}
          />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <ListRow title="Version" meta={APP_VERSION} />
          <ListRow
            title="Check for updates"
            subtitle={isCheckingUpdate ? 'Checking…' : 'Fetch and apply the latest update now'}
            onPress={handleCheckForUpdates}
          />
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
    title: {
      ...typography.title,
      fontSize: 20,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
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
      borderRadius: radius.pill,
      marginTop: spacing.xxs,
    },
    pillSeg: {
      paddingHorizontal: spacing.s,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
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
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    accentSwatchSelected: {
      borderColor: colors.textPrimary,
    },

    footer: {
      alignItems: 'center',
      gap: 6,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    footerWord: {
      ...typography.title,
      fontSize: 13,
      letterSpacing: 0.2,
      color: colors.textSecondary,
    },
  });
