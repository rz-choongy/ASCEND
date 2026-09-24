import { useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { APP_VERSION } from '../changelog';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, ScreenHeader, font, radius, showDialog, spacing, useTheme, type Shadows } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const REPORT_EMAIL = 'choongzhuocen@gmail.com';

/** Same "what's actually running" logic as Settings' Build row -- see runningUpdateLabel there. */
const buildLabel = Updates.isEmbeddedLaunch
  ? 'Embedded (dev/local build)'
  : Updates.updateId
    ? `${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'no channel'}`
    : 'Unknown';

const diagnosticsBlock = () =>
  [
    `App version: ${APP_VERSION}`,
    `Build: ${buildLabel}`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
    `Reported: ${new Date().toLocaleString()}`,
  ].join('\n');

export const BugReportScreen = ({ navigation }: RootStackScreenProps<'BugReport'>) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);

  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const diagnostics = useMemo(diagnosticsBlock, []);
  const canSend = description.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    const subject = `ASCEND Bug Report (v${APP_VERSION})`;
    const body = `${description.trim()}\n\n---\n${diagnostics}`;
    try {
      const mailUrl = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (await Linking.canOpenURL(mailUrl)) {
        await Linking.openURL(mailUrl);
      } else {
        // No mail client configured -- hand the same text to the share sheet
        // so the report can still go out some other way.
        await Share.share({ message: `${subject}\n\n${body}` });
      }
      navigation.goBack();
    } catch (e) {
      showDialog("Couldn't send report", e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        eyebrow="Support"
        title="Report a bug"
        closeLabel="Cancel"
        onClose={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.label}>What happened?</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What happened? What did you expect instead?"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          textAlignVertical="top"
          editable={!sending}
        />

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Included with your report</Text>
          <Text style={styles.noticeBody}>{diagnostics}</Text>
        </View>

        <Button
          label={sending ? 'Sending…' : 'Send Report'}
          variant="primary"
          onPress={handleSend}
          disabled={!canSend}
          style={styles.send}
        />
      </ScrollView>
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
    },
    content: {
      gap: spacing.xs,
      paddingBottom: spacing.lg,
    },
    label: {
      ...typography.section,
    },
    input: {
      minHeight: 120,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
      color: colors.textPrimary,
      paddingHorizontal: spacing.s,
      paddingVertical: spacing.s,
      fontSize: 16,
      ...font('regular'),
    },
    notice: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
      padding: spacing.s,
      gap: spacing.xxs,
    },
    noticeTitle: {
      ...typography.body,
      ...font('semibold'),
    },
    noticeBody: {
      ...typography.bodyMuted,
      lineHeight: 20,
    },
    send: {
      marginTop: spacing.xs,
    },
  });
