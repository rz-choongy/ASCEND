import { useMemo, useState } from 'react';
import { Image, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
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
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const diagnostics = useMemo(diagnosticsBlock, []);
  const canSend = description.trim().length > 0 && !sending;

  const handleAttachScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showDialog('Photo access needed', 'Allow photo library access to attach a screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    const subject = `ASCEND Bug Report (v${APP_VERSION})`;
    const body = `${description.trim()}\n\n---\n${diagnostics}`;
    try {
      if (await MailComposer.isAvailableAsync()) {
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
