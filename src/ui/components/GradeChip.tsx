import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { getContrastText } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';

type GradeChipProps = {
  label: string;
  /** The grade's tape colour. */
  color: string;
  style?: ViewStyle;
};

/**
 * A small tape-coloured grade label for lists, the pyramid and session rows.
 * Small on purpose: a big figure (hardest, best) is plain text with a dot, via StatRow.
 */
export const GradeChip = ({ label, color, style }: GradeChipProps) => (
  <View style={[styles.chip, { backgroundColor: color }, style]}>
    <Text style={[styles.text, { color: getContrastText(color) === '#000000' ? '#151515' : '#ffffff' }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  chip: {
    minWidth: 32,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  text: {
    ...font('display'),
    fontSize: 15,
    lineHeight: 18,
  },
});
