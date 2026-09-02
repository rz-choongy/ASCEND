import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ensureSelectedClimbGym, getSelectedClimbGym } from '../domain/gymStore';
import { getShowSessionTimer, setShowSessionTimer } from '../domain/settingsStore';
import type { RootStackScreenProps } from '../navigation/types';
import { ACCENT_PALETTE, ListRow, PressableScale, SegmentedControl, spacing, useTheme } from '../ui';
import type { AccentColorId, ThemeColors, ThemeMode } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const ACCENT_OPTIONS = Object.entries(ACCENT_PALETTE) as [AccentColorId, (typeof ACCENT_PALETTE)[AccentColorId]][];

type SettingsScreenProps = RootStackScreenProps<'Settings'>;

// Bumped by hand with each shipped round of changes (major.minor only, no
// patch digit). Deliberately separate from app.json's "version" field, which
// drives EAS's runtimeVersion (policy: "appVersion") -- bumping that would
// break OTA updates for already-installed builds, since it changes what
// runtime an `eas update` targets.
const APP_VERSION = '1.5';

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
          <View style={styles.backChevron} />
        </PressableScale>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
          <ListRow
            title="Theme"
            right={
              <SegmentedControl
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
                value={mode}
                onChange={setThemeMode}
              />
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
      borderRadius: 18,
    },
    backChevron: {
      width: 9,
      height: 9,
      borderLeftWidth: 2,
      borderBottomWidth: 2,
      borderColor: colors.textPrimary,
      transform: [{ rotate: '45deg' }],
      marginLeft: 4,
    },
    title: {
      ...typography.title,
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
    accentSwatchRow: {
      flexDirection: 'row',
      gap: spacing.xxs,
      marginTop: 4,
    },
    accentSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    accentSwatchSelected: {
      borderColor: colors.textPrimary,
    },
  });
