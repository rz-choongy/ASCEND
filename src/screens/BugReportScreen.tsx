import { useMemo, useState } from 'react';
import { Image, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo';
import * as Updates from 'expo-updates';
import { APP_VERSION } from '../changelog';
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  isBugReportApiConfigured,
  submitBugReport,
  type BugAttachment,
} from '../domain/bugReportApi';
import { getInstallId } from '../domain/settingsStore';
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

const collectDiagnostics = (): Record<string, string> => ({
  'App version': APP_VERSION,
  Build: buildLabel,
  Platform: `${Platform.OS} ${Platform.Version}`,
  Install: getInstallId(),
  Reported: new Date().toLocaleString(),
});

type PickedAttachment = BugAttachment & { durationMs?: number | null };

const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const formatDiagnostics = (diagnostics: Record<string, string>) =>
  Object.entries(diagnostics)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

export const BugReportScreen = ({ navigation }: RootStackScreenProps<'BugReport'>) => {
  const { colors, typography, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, shadows), [colors, typography, shadows]);

  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<PickedAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const diagnosticsData = useMemo(collectDiagnostics, []);
  const diagnostics = useMemo(() => formatDiagnostics(diagnosticsData), [diagnosticsData]);
  const canSend = description.trim().length > 0 && !sending;

  const handleAddAttachments = async () => {
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) return;
    try {
      // Imported lazily, not at module scope, and only after the probe: BugReportScreen is imported
      // eagerly by App.tsx, and expo-image-picker throws (fatally, see hasNativeModule) when
      // its native module isn't in the install.
      if (!hasNativeModule('ExponentImagePicker')) {
        showDialog("Can't attach files yet", 'This install needs a new build to attach screenshots to bug reports.');
        return;
      }
      const ImagePicker = await import('expo-image-picker');
      // No media-library permission request: launchImageLibraryAsync uses the system photo
      // picker, which needs none. Asking anyway is worse than useless on Android 13+, where
      // READ_EXTERNAL_STORAGE can never be granted, so the request always came back denied.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: room,
        quality: 0.7,
      });
      if (result.canceled) return;
      const picked = result.assets.map<PickedAttachment & { tooBig: boolean }>((asset) => ({
        uri: asset.uri,
        kind: asset.type === 'video' ? 'video' : 'image',
        mimeType: asset.mimeType ?? null,
        durationMs: asset.duration ?? null,
        tooBig: (asset.fileSize ?? 0) > MAX_ATTACHMENT_BYTES,
      }));
      const kept = picked.filter((a) => !a.tooBig).map(({ tooBig: _tooBig, ...a }) => a);
      setAttachments((current) => [...current, ...kept].slice(0, MAX_ATTACHMENTS));
      if (kept.length < picked.length) {
        showDialog('Video too large', 'Files over 50 MB are left out. Trim the recording to the part that shows the bug.');
      }
    } catch (e) {
      showDialog("Couldn't attach the file", e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const removeAttachment = (uri: string) => setAttachments((current) => current.filter((a) => a.uri !== uri));

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    // Straight to the report inbox when it's configured; email / share sheet is the fallback for
    // builds without the env vars, or when the network call fails.
    let inboxError: string | null = null;
    if (isBugReportApiConfigured()) {
      try {
        await submitBugReport({
          source: 'user',
          installId: diagnosticsData.Install,
          description,
          appVersion: APP_VERSION,
          diagnostics: diagnosticsData,
          attachments,
        });
        setSending(false);
        navigation.goBack();
        showDialog('Report sent', 'Thanks! It goes straight to the fix queue.');
        return;
      } catch (e) {
        // Fall through to email, but keep the reason: a silent fallback hid inbox failures before.
        inboxError = e instanceof Error ? e.message : String(e);
        console.warn(`Bug report inbox failed, falling back to email: ${inboxError}`);
      }
    }
    const subject = `ASCEND Bug Report (v${APP_VERSION})`;
    const inboxLine = inboxError ? `\nInbox error: ${inboxError}` : '';
    const body = `${description.trim()}\n\n---\n${diagnostics}${inboxLine}`;
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
          attachments: attachments.map((a) => a.uri),
        });
        if (result.status !== MailComposer.MailComposerStatus.CANCELLED) {
          navigation.goBack();
        }
      } else {
        // No mail account configured -- hand the text to the share sheet so the
        // report can still go out some other way. The share sheet doesn't
        // reliably carry both a file and a message together, so this
        // fallback path is text-only even if files were attached.
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

        <Text style={styles.label}>Screenshots or a screen recording</Text>
        {attachments.length > 0 && (
          <View style={styles.attachments}>
            {attachments.map((attachment, index) => (
              <View key={attachment.uri} style={styles.attachment}>
                {attachment.kind === 'image' ? (
                  <Image source={{ uri: attachment.uri }} style={styles.attachmentTile} />
                ) : (
                  // No thumbnail module in the build, so a video shows as a labelled tile.
                  <View style={[styles.attachmentTile, styles.videoTile]}>
                    <Text style={styles.videoGlyph}>▶</Text>
                    <Text style={styles.videoLabel}>
                      {attachment.durationMs ? formatDuration(attachment.durationMs) : 'Video'}
                    </Text>
                  </View>
                )}
                <IconButton
                  variant="bare"
                  size={28}
                  onPress={() => removeAttachment(attachment.uri)}
                  accessibilityLabel={`Remove ${attachment.kind === 'video' ? 'video' : 'screenshot'} ${index + 1}`}
                  style={styles.attachmentRemove}
                  disabled={sending}
                >
                  <CloseIcon size={14} color={colors.textPrimary} />
                </IconButton>
              </View>
            ))}
          </View>
        )}
        {attachments.length < MAX_ATTACHMENTS && (
          <Button
            label={attachments.length === 0 ? 'Add screenshots or video' : 'Add more'}
            variant="secondary"
            onPress={handleAddAttachments}
            disabled={sending}
          />
        )}
        <Text style={styles.hint}>Up to {MAX_ATTACHMENTS} files. Videos up to 50 MB.</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Included with your report</Text>
          <Text style={styles.noticeBody}>{diagnostics}</Text>
        </View>

        <Button
          label={sending ? 'Sending…' : 'Send report'}
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
      fontSize: 14,
      ...font('regular'),
    },
    attachments: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.s,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxs,
    },
    attachment: {
      position: 'relative',
    },
    attachmentTile: {
      width: 80,
      height: 80,
      borderRadius: radius.md,
      backgroundColor: colors.fill,
    },
    videoTile: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xxs,
    },
    videoGlyph: {
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 22,
    },
    videoLabel: {
      ...typography.meta,
      color: colors.textSecondary,
    },
    attachmentRemove: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    hint: {
      ...typography.meta,
      color: colors.textMuted,
    },
    notice: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
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
