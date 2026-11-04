import {
  GoogleSansFlex_400Regular,
  GoogleSansFlex_500Medium,
  GoogleSansFlex_600SemiBold,
  GoogleSansFlex_700Bold,
} from '@expo-google-fonts/google-sans-flex';

/** Passed to `useFonts` in App.tsx; the keys become the family names below. */
export const fontAssets = {
  GoogleSansFlex_400Regular,
  GoogleSansFlex_500Medium,
  GoogleSansFlex_600SemiBold,
  GoogleSansFlex_700Bold,
};

// Each weight is its own family. Android ignores `fontWeight` on a custom
// face, so weight is chosen by naming the family -- never set `fontWeight`
// alongside these, or iOS may fall back to the system font.
//
// Google Sans Flex throughout. `display` (600) is for screen titles, big
// numbers and grade tiles: normal width, medium weight, nothing condensed.
export const fontFamily = {
  regular: 'GoogleSansFlex_400Regular',
  medium: 'GoogleSansFlex_500Medium',
  semibold: 'GoogleSansFlex_600SemiBold',
  bold: 'GoogleSansFlex_700Bold',
  display: 'GoogleSansFlex_600SemiBold',
  // Durations and timers: tabular figures (see typography.mono).
  mono: 'GoogleSansFlex_500Medium',
} as const;
export type FontWeightName = keyof typeof fontFamily;

export const font = (weight: FontWeightName) => ({ fontFamily: fontFamily[weight] });
