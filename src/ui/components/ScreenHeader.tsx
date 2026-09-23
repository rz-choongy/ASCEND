import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import type { Typography } from '../tokens/typography';
import { Button } from './Button';
import { CloseIcon } from './Icon';
import { IconButton } from './IconButton';

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  onClose?: () => void;
  /** A text action (e.g. "Cancel") instead of the default close circle. */
  closeLabel?: string;
  left?: ReactNode;
};

export const ScreenHeader = ({
  eyebrow,
  title,
  onClose,
  closeLabel,
  left,
}: ScreenHeaderProps) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  return (
    <View style={styles.header}>
      <View style={styles.textCol}>
        {left}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {onClose && closeLabel ? (
        <Button
          label={closeLabel}
          variant="plain"
          onPress={onClose}
          style={styles.closeButton}
          textStyle={styles.closeText}
        />
      ) : onClose ? (
        // Prism's bordered icon circle, top-right like its settings trigger.
        <IconButton onPress={onClose} accessibilityLabel="Close">
          <CloseIcon size={16} color={colors.textPrimary} />
        </IconButton>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s,
      marginBottom: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    eyebrow: {
      ...typography.section,
      marginBottom: 2,
    },
    title: {
      ...typography.title,
      marginTop: 1,
    },
    closeButton: {
      minHeight: 34,
      paddingHorizontal: 4,
      marginRight: -4,
    },
    closeText: {
      fontSize: 16,
    },
  });
