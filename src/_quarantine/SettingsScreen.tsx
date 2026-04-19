import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../ui';

export const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.text}>Settings coming soon.</Text>
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
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
