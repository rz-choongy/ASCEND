import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';

/** Passed to `useFonts` in App.tsx; the keys become the family names below. */
export const fontAssets = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  GeistMono_500Medium,
};

// Each weight is its own family. Android ignores `fontWeight` on a custom
// face, so weight is chosen by naming the family -- never set `fontWeight`
// alongside these, or iOS may fall back to the system font.
export const fontFamily = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  mono: 'GeistMono_500Medium',
} as const;

export type FontWeightName = keyof typeof fontFamily;

export const font = (weight: FontWeightName) => ({ fontFamily: fontFamily[weight] });
