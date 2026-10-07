import { useMemo, useState } from 'react';
import { Image, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo';
import * as Updates from 'expo-updates';
import { APP_VERSION } from '../changelog';
import type { RootStackScreenProps } from '../navigation/types';
import {
  Button,
  CloseIcon,
  IconButton,
  ScreenHeader,
  font,
  radius,
  showDialog,
  spacing,
  useTheme,
  type Shadows,
} from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

// Sourced from the environment rather than hardcoded, so a personal address never sits in
// this public repo. Set EXPO_PUBLIC_REPORT_EMAIL in .env.local for dev and as an EAS
// environment variable for builds; when it's unset, reports fall back to the share sheet.
const REPORT_EMAIL = process.env.EXPO_PUBLIC_REPORT_EMAIL ?? '';

/**
 * Whether this install has a native module compiled in. Both packages below resolve their native
 * module the instant they're imported, and Metro reports a throw from module init as a *fatal* JS
 * error -- a try/catch around `import()` never sees it, and in a release build it takes the app
 * down. Probing with requireOptionalNativeModule (returns null instead of throwing) is the only
 * safe way to find out before importing.
 */
const hasNativeModule = (name: string): boolean => requireOptionalNativeModule(name) != null;

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
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const diagnostics = useMemo(diagnosticsBlock, []);
  const canSend = description.trim().length > 0 && !sending;

  const handleAttachScreenshot = async () => {
    try {
      // Imported lazily, not at module scope, and only after the probe: BugReportScreen is imported
      // eagerly by App.tsx, and expo-image-picker throws (fatally, see hasNativeModule) when
      // its native module isn't in the install.
      if (!hasNativeModule('ExponentImagePicker')) {
        showDialog("Can't attach a screenshot yet", 'This install needs a new build to attach screenshots to bug reports.');
        return;
      }
      const ImagePicker = await import('expo-image-picker');
      // No media-library permission request: launchImageLibraryAsync uses the system photo
      // picker, which needs none. Asking anyway is worse than useless on Android 13+, where
      // READ_EXTERNAL_STORAGE can never be granted, so the request always came back denied.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setScreenshotUri(result.assets[0].uri);
      }
    } catch (e) {
      showDialog("Couldn't attach the screenshot", e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    const subject = `ASCEND Bug Report (v${APP_VERSION})`;
    const body = `${description.trim()}\n\n---\n${diagnostics}`;
    try {
      // See the comment in handleAttachScreenshot -- same reason this is a
      // lazy import rather than a module-level one.
      // Installs whose native build predates expo-mail-composer are treated the same as "no mail
      // account" so the report still goes out via the share sheet. Probe first -- see
      // hasNativeModule for why a try/catch around the import isn't enough.
      const MailComposer = hasNativeModule('ExpoMailComposer') ? await import('expo-mail-composer') : null;
      if (REPORT_EMAIL && MailComposer && (await MailComposer.isAvailableAsync().catch(() => false))) {
        const result = await MailComposer.composeAsync({
          recipients: [REPORT_EMAIL],
          subject,
          body,
          attachments: screenshotUri ? [screenshotUri] : [],
        });
        if (result.status !== MailComposer.MailComposerStatus.CANCELLED) {
          navigation.goBack();
        }
      } else {
        // No mail account configured -- hand the text to the share sheet so the
        // report can still go out some other way. The share sheet doesn't
        // reliably carry both a file and a message together, so this
        // fallback path is text-only even if a screenshot was attached.
        await Share.share({ message: `${subject}\n\n${body}` });
        navigation.goBack();
      }
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

        <Text style={styles.label}>Screenshot</Text>
        {screenshotUri ? (
          <View style={styles.screenshotPreview}>
            <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} />
            <IconButton
              variant="bare"
              size={28}
              onPress={() => setScreenshotUri(null)}
              accessibilityLabel="Remove screenshot"
              style={styles.screenshotRemove}
            >
              <CloseIcon size={14} color={colors.textPrimary} />
            </IconButton>
          </View>
        ) : (
          <Button
            label="Attach a screenshot"
            variant="secondary"
            onPress={handleAttachScreenshot}
            disabled={sending}
          />
        )}

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
    screenshotPreview: {
      alignSelf: 'flex-start',
    },
    screenshotImage: {
      width: 96,
      height: 96,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
    },
    screenshotRemove: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
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
