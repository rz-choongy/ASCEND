import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';
import { Button } from './Button';

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  onClose?: () => void;
  left?: ReactNode;
};

export const ScreenHeader = ({ eyebrow, title, onClose, left }: ScreenHeaderProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  return (
    <View style={styles.header}>
      <View style={styles.textCol}>
        {left}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onClose ? (
        <Button
          label="Close"
          variant="ghost"
          onPress={onClose}
          style={styles.closeButton}
          textStyle={styles.closeText}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    eyebrow: {
      ...typography.meta,
      color: colors.accent,
    },
    title: {
      ...typography.title,
      marginTop: 2,
    },
    closeButton: {
      minHeight: 38,
      paddingHorizontal: 12,
    },
    closeText: {
      fontSize: 10,
    },
  });
