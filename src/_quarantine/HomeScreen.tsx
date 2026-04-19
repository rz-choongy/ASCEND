import { StyleSheet, Text, View } from 'react-native';
import type { SessionRow, SessionType } from '../domain/types';
import { Button, Card, Divider, colors, spacing, typography } from '../ui';

type HomeScreenProps = {
  activeSession: SessionRow | null;
  onStartQuickSession: (type: SessionType) => void;
  onResumeSession: () => void;
};

export const HomeScreen = ({
  activeSession,
  onStartQuickSession,
  onResumeSession,
}: HomeScreenProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {activeSession ? (
        <Card style={styles.banner}>
          <Text style={styles.bannerTitle}>Active session: {activeSession.type}</Text>
          <View style={styles.bannerRow}>
            <Button label="Resume" onPress={onResumeSession} style={styles.bannerButton} />
          </View>
        </Card>
      ) : null}

      <Divider style={styles.divider} />
      <Text style={styles.sectionTitle}>Quick Start</Text>
      <View style={styles.quickRow}>
        <Button label="Start Strength" onPress={() => onStartQuickSession('strength')} style={styles.quickButton} />
        <Button label="Start Climb" variant="secondary" onPress={() => onStartQuickSession('climb')} style={styles.quickButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  banner: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  bannerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bannerButton: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.section,
    marginBottom: spacing.xs,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickButton: {
    flex: 1,
  },
});
