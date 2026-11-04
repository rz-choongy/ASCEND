import { StyleSheet, View, type ViewStyle } from 'react-native';

type SessionStripProps = {
  /** One tape colour per climb, oldest first. */
  colors: string[];
  height?: number;
  style?: ViewStyle;
};

/** A session drawn as a strip of grade colours, one segment per climb. */
export const SessionStrip = ({ colors, height = 10, style }: SessionStripProps) => {
  if (colors.length === 0) return null;
  return (
    <View style={[styles.strip, { height }, style]}>
      {colors.map((color, i) => (
        <View key={i} style={[styles.segment, { backgroundColor: color }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});
