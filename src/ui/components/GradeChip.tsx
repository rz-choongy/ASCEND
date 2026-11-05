import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { getContrastText } from '../tokens/colors';
import { font } from '../tokens/fonts';
import { radius } from '../tokens/radius';
import { useTheme } from '../theme/ThemeContext';

type GradeChipProps = {
  label: string;
  /** The grade's tape colour. */
  color: string;
  style?: ViewStyle;
  /** `dot` is plain text with a small tape dot, for lists. `fill` is the tape block, for the pyramid. */
  variant?: 'fill' | 'dot';
};

/**
 * A small tape-coloured grade label for lists, the pyramid and session rows.
 * Small on purpose: a big figure (hardest, best) is plain text with a dot, via StatRow.
 */
export const GradeChip = ({ label, color, style, variant = 'fill' }: GradeChipProps) =>
  variant === 'dot' ? <GradeDot label={label} color={color} style={style} /> : (
  <View style={[styles.chip, { backgroundColor: color }, style]}>
    <Text style={[styles.text, { color: getContrastText(color) === '#000000' ? '#151515' : '#ffffff' }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const GradeDot = ({ label, color, style }: { label: string; color: string; style?: ViewStyle }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.dotRow, style]}>
      <View style={[styles.dot, { backgroundColor: color, borderColor: colors.border }]} />
      <Text style={[styles.dotText, { color: colors.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dotText: {
    ...font('medium'),
    fontSize: 13,
    lineHeight: 16,
  },
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
    fontSize: 13,
    lineHeight: 16,
  },
});
