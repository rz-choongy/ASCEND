import {
  SofiaSans_400Regular,
  SofiaSans_500Medium,
  SofiaSans_600SemiBold,
  SofiaSans_700Bold,
} from '@expo-google-fonts/sofia-sans';
import { SofiaSansExtraCondensed_800ExtraBold } from '@expo-google-fonts/sofia-sans-extra-condensed';

/** Passed to `useFonts` in App.tsx; the keys become the family names below. */
export const fontAssets = {
  SofiaSans_400Regular,
  SofiaSans_500Medium,
  SofiaSans_600SemiBold,
  SofiaSans_700Bold,
  SofiaSansExtraCondensed_800ExtraBold,
};

// Each weight is its own family. Android ignores `fontWeight` on a custom
// face, so weight is chosen by naming the family -- never set `fontWeight`
// alongside these, or iOS may fall back to the system font.
//
// Sofia Sans for body, labels and buttons. Sofia Sans Extra Condensed 800
// (`display`) for screen titles, big numbers and grade tiles only.
export const fontFamily = {
  regular: 'SofiaSans_400Regular',
  medium: 'SofiaSans_500Medium',
  semibold: 'SofiaSans_600SemiBold',
  bold: 'SofiaSans_700Bold',
  display: 'SofiaSansExtraCondensed_800ExtraBold',
  // Kept for durations and timers: Sofia Sans with tabular figures (see typography.mono).
  mono: 'SofiaSans_600SemiBold',
} as const;
export type FontWeightName = keyof typeof fontFamily;

export const font = (weight: FontWeightName) => ({ fontFamily: fontFamily[weight] });
