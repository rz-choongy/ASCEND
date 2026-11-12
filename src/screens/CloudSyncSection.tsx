import { useCallback, useState } from 'react';
import { Share, Switch, Text, type TextStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatDaysAgo } from '../domain/strengthProgress';
import { isCloudConfigured } from '../integrations/cloud/cloudConfig';
import {
  getCloudLastSync,
  getCloudSyncEnabled,
  getConnectorUrl,
  setCloudSyncEnabled,
  type CloudLastSync,
} from '../integrations/cloud/cloudSettings';
import {
  deleteCloudCopy,
  getOrCreateConnectorUrl,
  resetConnectorUrl,
  syncCloud,
} from '../integrations/cloud/cloudSync';
import { ListGroup, ListRow, showDialog, useTheme } from '../ui';

const statusLine = (syncing: boolean, last: CloudLastSync | null): string => {
  if (syncing) return 'Syncing…';
  if (!last) return 'Not synced yet';
  if (!last.ok) return `Last try failed: ${last.error ?? 'unknown error'}`;
  return `Last synced ${formatDaysAgo(last.at)}`;
};

const shareLink = (url: string) =>
  Share.share({
    message: `ASCEND connector URL (add it as a custom MCP connector in Claude, ChatGPT or Instinct). Anyone with this link can read your log:\n\n${url}`,
  });

/**
 * Settings section for the opt-in cloud copy that assistants read through MCP. Hidden when the
 * build has no Supabase config.
 */
export const CloudSyncSection = ({ labelStyle }: { labelStyle: TextStyle }) => {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [last, setLast] = useState<CloudLastSync | null>(null);
  const [hasLink, setHasLink] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setEnabled(getCloudSyncEnabled());
    setLast(getCloudLastSync());
    setHasLink(getConnectorUrl() !== null);
  }, []);

  useFocusEffect(refresh);

  if (!isCloudConfigured()) return null;

  const run = async (work: () => Promise<void>, failTitle: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await work();
    } catch (e) {
      showDialog(failTitle, e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const handleToggle = (value: boolean) => {
    setCloudSyncEnabled(value);
    setEnabled(value);
    if (value) void run(async () => void (await syncCloud()), "Couldn't sync");
  };

  const handleSyncNow = () => run(async () => void (await syncCloud()), "Couldn't sync");

  const handleConnect = () =>
    run(async () => {
      const url = await getOrCreateConnectorUrl();
      await shareLink(url);
    }, "Couldn't make a link");

  const handleReset = () =>
    showDialog('Reset assistant link?', 'Assistants using the old link lose access. You’ll get a new link to share.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset link',
        style: 'destructive',
        onPress: () =>
          void run(async () => {
            const url = await resetConnectorUrl();
            await shareLink(url);
          }, "Couldn't reset the link"),
      },
    ]);

  const handleDelete = () =>
    showDialog(
      'Delete cloud copy?',
      'Removes every session ASCEND has synced and turns cloud sync off. Your log on this phone is untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void run(deleteCloudCopy, "Couldn't delete the cloud copy"),
        },
      ]
    );

  return (
    <>
      <Text style={labelStyle}>Cloud & assistants</Text>
      <ListGroup>
        <ListRow
          title="Sync to cloud"
          subtitle="Lets Claude, ChatGPT and other assistants read your sessions"
          right={
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.fill, true: colors.accent }}
              thumbColor="#ffffff"
            />
          }
        />
        {enabled ? (
          <ListRow title="Sync now" subtitle={statusLine(busy, last)} onPress={handleSyncNow} />
        ) : null}
        {enabled ? (
          <ListRow
            title={hasLink ? 'Share assistant link' : 'Connect an assistant'}
            subtitle="A private MCP link to add as a connector"
            onPress={handleConnect}
          />
        ) : null}
        {enabled && hasLink ? (
          <ListRow title="Reset assistant link" subtitle="Cuts off the old link" onPress={handleReset} />
        ) : null}
        {enabled || last ? (
          <ListRow title="Delete cloud copy" subtitle="Keeps everything on this phone" onPress={handleDelete} />
        ) : null}
      </ListGroup>
    </>
  );
};
