import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { font, PressableScale, useTheme, type Shadows } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import { TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset, useTabBarSideMargin } from './tabBar';

type DockProps = BottomTabBarProps & {
  renderIcon: (routeName: string, color: string) => ReactNode;
};

/**
 * Prism's floating toolbar as the app's tab bar: a compact centred pill above
 * the home indicator, the active tab marked by a tinted capsule. Drawn by hand
 * because the stock bar can't round or size its active background.
 */
export const Dock = ({ state, descriptors, navigation, renderIcon }: DockProps) => {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const bottom = useTabBarBottomOffset();
  const side = useTabBarSideMargin();

  return (
    <View style={[styles.dock, { bottom, left: side, right: side }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const color = focused ? colors.action : colors.textMuted;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <PressableScale
            key={route.key}
            onPress={onPress}
            scaleTo={0.94}
            accessibilityLabel={label}
            style={[styles.item, focused ? styles.itemActive : null]}
          >
            {renderIcon(route.name, color)}
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    dock: {
      position: 'absolute',
      height: TAB_BAR_HEIGHT,
      flexDirection: 'row',
      padding: TAB_BAR_INSET,
      gap: 4,
      borderRadius: TAB_BAR_HEIGHT / 2,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...shadows.card,
    },
    item: {
      flex: 1,
      borderRadius: (TAB_BAR_HEIGHT - TAB_BAR_INSET * 2) / 2,
      gap: 2,
    },
    itemActive: {
      backgroundColor: colors.accentMuted,
    },
    label: {
      ...font('medium'),
      fontSize: 10,
    },
  });
