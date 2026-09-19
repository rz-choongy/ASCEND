import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KilterAuthError, kilterAuth } from '../integrations/kilter/kilterAuth';
import { syncKilter } from '../integrations/kilter/kilterSync';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, ScreenHeader, radius, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

export const KilterConnectScreen = ({ navigation }: RootStackScreenProps<'KilterConnect'>) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConnect = acknowledged && username.trim().length > 0 && password.length > 0 && !busy;

  const handleConnect = async () => {
    if (!canConnect) return;
    setBusy(true);
    setError(null);
    try {
      await kilterAuth.login(username.trim(), password);
      // The password has done its job; don't keep it in component state a moment longer.
      setPassword('');
      const result = await syncKilter();
      Alert.alert(
        'Kilter connected',
        result.added === 0
          ? 'No new sends to import.'
          : `Imported ${result.added} send${result.added === 1 ? '' : 's'}.`
      );
      navigation.goBack();
    } catch (e) {
      setError(e instanceof KilterAuthError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        eyebrow="Kilter Board"
        title="Connect account"
        closeLabel="Cancel"
        onClose={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.copy}>
          ASCEND signs in to your Kilter account and imports your sends. Your password goes only to
          Kilter and is never saved; ASCEND keeps a sign-in token in your device's secure storage.
        </Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Unofficial connection</Text>
          <Text style={styles.noticeBody}>
            Kilter has no public API. This uses the same sign-in as the Kilter app, so it can stop
            working whenever Kilter changes something, and Kilter's Terms of Use restrict access outside
            their official apps. You use it at your own risk.
          </Text>
          <View style={styles.ackRow}>
            <Text style={styles.ackLabel}>I understand</Text>
            <Switch
              value={acknowledged}
              onValueChange={setAcknowledged}
              trackColor={{ false: colors.fill, true: colors.accent }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Your Kilter username"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          editable={!busy}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Your Kilter password"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          editable={!busy}
          onSubmitEditing={handleConnect}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={busy ? 'Connecting…' : 'Connect and import'}
          variant="primary"
          onPress={handleConnect}
          disabled={!canConnect}
          style={styles.connect}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
    },
    content: {
      gap: spacing.xs,
      paddingBottom: spacing.lg,
    },
    copy: {
      ...typography.bodyMuted,
      lineHeight: 20,
    },
    notice: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.s,
      gap: spacing.xs,
    },
    noticeTitle: {
      ...typography.body,
      fontWeight: '600',
    },
    noticeBody: {
      ...typography.bodyMuted,
      lineHeight: 20,
    },
    ackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ackLabel: {
      ...typography.body,
    },
    label: {
      ...typography.section,
      marginTop: spacing.xs,
    },
    // Filled text field, no outline -- how iOS draws an input inside a form.
    input: {
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
      color: colors.textPrimary,
      paddingHorizontal: spacing.s,
      fontSize: 16,
      fontWeight: '400',
    },
    error: {
      ...typography.bodyMuted,
      color: colors.danger,
    },
    connect: {
      marginTop: spacing.xs,
    },
  });
