// Placeholder — will be built in Step 3
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../ui';

export function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendar — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textMuted, fontSize: 14 },
});
