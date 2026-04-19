// Placeholder — will be built in Step 4
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../ui';

export function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Log — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textMuted, fontSize: 14 },
});
