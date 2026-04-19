import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';

type DividerProps = {
  style?: ViewStyle;
};

export const Divider = ({ style }: DividerProps) => {
  return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
});
