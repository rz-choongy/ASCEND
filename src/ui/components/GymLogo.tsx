import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { gymLogoUrl } from '../../domain/gymLogo';
import { font } from '../tokens/fonts';
import { useTheme } from '../theme/ThemeContext';

type GymLogoProps = {
  /** Website the logo comes from. Null shows the gym's first letter. */
  domain: string | null;
  name: string;
  size?: number;
};

/** A gym's logo loaded from the web, or its first letter when there is none or it fails to load. */
export const GymLogo = ({ domain, name, size = 36 }: GymLogoProps) => {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [domain]);

  const box = { width: size, height: size, borderRadius: size * 0.28 };

  if (domain && !failed) {
    return (
      <View style={[styles.logoTile, box, { borderColor: colors.border }]}>
        <Image
          source={{ uri: gymLogoUrl(domain) }}
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
