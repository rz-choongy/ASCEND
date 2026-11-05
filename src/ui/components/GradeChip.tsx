import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { getContrastText, type ThemeColors, type ThemeMode } from '../tokens/colors';
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

/** WCAG relative luminance of a #rrggbb hex, or null for anything else. */
const luminanceOf = (hex: string): number | null => {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  const channel = (start: number) => {
    const c = parseInt(clean.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
};

/** Below this contrast ratio a tape blends into the card: V7 black on a dark card, V0 white on a light one. */
const MIN_TAPE_CONTRAST = 1.5;

/**
 * The outline a tape colour needs to stay visible on the card surface, or null when it reads fine
 * on its own. Dark tapes in dark mode take the muted text grey; the soft border is too close to black.
 */
export const tapeOutlineColor = (tape: string, colors: ThemeColors, mode: ThemeMode): string | null => {
  const tapeL = luminanceOf(tape);
  const surfaceL = luminanceOf(colors.surface);
  if (tapeL === null || surfaceL === null) return null;
  const ratio = (Math.max(tapeL, surfaceL) + 0.05) / (Math.min(tapeL, surfaceL) + 0.05);
  if (ratio >= MIN_TAPE_CONTRAST) return null;
  return mode === 'dark' && tapeL <= surfaceL + 0.02 ? colors.textMuted : colors.borderSoft;
};

/**
 * A small tape-coloured grade label for lists, the pyramid and session rows.
 * Small on purpose: a big figure (hardest, best) is plain text with a dot, via StatRow.
 */
export const GradeChip = ({ label, color, style, variant = 'fill' }: GradeChipProps) => {
  const { colors, mode } = useTheme();
  const outline = tapeOutlineColor(color, colors, mode);

  if (variant === 'dot') {
    return (
      <View style={[styles.dotRow, style]}>
        <View
          style={[
            styles.dot,
            { backgroundColor: color, borderColor: outline ?? colors.border },
            outline ? styles.outlined : null,
          ]}
        />
        <Text style={[styles.dotText, { color: colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: color }, outline ? [styles.outlined, { borderColor: outline }] : null, style]}>
      <Text style={[styles.text, { color: getContrastText(color) === '#000000' ? '#151515' : '#ffffff' }]} numberOfLines={1}>
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
  outlined: {
    borderWidth: 1,
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
