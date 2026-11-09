import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { font } from '../tokens/fonts';
import { useTheme } from '../theme/ThemeContext';

type GymLogoProps = {
  /** Logo image (web URL or picked photo). Null shows the gym's first letter. */
  uri: string | null;
  name: string;
  size?: number;
};

/** A gym's logo loaded from the web, or its first letter when there is none or it fails to load. */
export const GymLogo = ({ uri, name, size = 36 }: GymLogoProps) => {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  const box = { width: size, height: size, borderRadius: size * 0.28 };

  // A picked photo fills its tile; a website icon sits inside a white one.
  if (uri?.startsWith('data:') && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[box, { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}
        resizeMode="cover"
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    );
  }

  if (uri && !failed) {
    return (
      <View style={[styles.logoTile, box, { borderColor: colors.border }]}>
        <Image
          source={{ uri }}
          style={{ width: size * 0.78, height: size * 0.78 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View style={[styles.letterTile, box, { backgroundColor: colors.fill }]}>
      <Text style={[styles.letter, { color: colors.textSecondary, fontSize: size * 0.42 }]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // White tile so dark and transparent logos read the same in dark mode.
  logoTile: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letterTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...font('semibold'),
  },
});
