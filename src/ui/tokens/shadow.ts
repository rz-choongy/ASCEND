import type { ViewStyle } from 'react-native';
import type { ThemeColors } from './colors';

// Prism's --shadow-sm / --shadow as native props. iOS reads the shadow* keys,
// Android reads `elevation`; both are set so no platform branch is needed.
// Dark mode passes a transparent shadow colour and zero elevation -- on a
// near-black ground the hairline border does the lifting instead.
export const createShadows = (colors: ThemeColors) => {
  const isFlat = colors.shadow === 'transparent';
  return {
    sm: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: isFlat ? 0 : 1,
    } satisfies ViewStyle,
    card: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: isFlat ? 0 : 3,
    } satisfies ViewStyle,
    lg: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: isFlat ? 0 : 8,
    } satisfies ViewStyle,
  };
};

export type Shadows = ReturnType<typeof createShadows>;
