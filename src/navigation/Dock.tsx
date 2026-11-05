import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { font, PressableScale, useTheme, type Shadows } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import { TAB_BAR_HEIGHT, TAB_BAR_INSET, useTabBarBottomOffset, useTabBarSideMargin } from './tabBar';

// The scrim under the dock: solid up to the dock's middle, then a fade in thin
// strips (no gradient package, so an over-the-air update never needs a new native module).
const SCRIM_FADE = 48;
const SCRIM_STRIPS = 12;
const SCRIM_SOLID = TAB_BAR_HEIGHT / 2;

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
    <>
      <View pointerEvents="none" style={[styles.scrim, { height: bottom + SCRIM_SOLID + SCRIM_FADE }]}>
        {Array.from({ length: SCRIM_STRIPS }, (_, i) => (
          // Top strip faintest; eased so the fade has no visible edge.
          <View key={i} style={[styles.scrimStrip, { opacity: ((i + 1) / (SCRIM_STRIPS + 1)) ** 1.6 }]} />
        ))}
        <View style={[styles.scrimSolid, { height: bottom + SCRIM_SOLID }]} />
      </View>
      <View style={[styles.dock, { bottom, left: side, right: side }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
          const color = focused ? colors.textPrimary : colors.textSecondary;
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
    </>
  );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) =>
  StyleSheet.create({
    scrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    scrimStrip: {
      height: SCRIM_FADE / SCRIM_STRIPS,
      backgroundColor: colors.background,
    },
    scrimSolid: {
      backgroundColor: colors.background,
    },
    dock: {
      position: 'absolute',
      height: TAB_BAR_HEIGHT,
      flexDirection: 'row',
      padding: TAB_BAR_INSET,
      gap: 4,
      borderRadius: TAB_BAR_HEIGHT / 2,
      backgroundColor: colors.surface,
      // A full 1px line, not a hairline: on light the white pill sits on a near-white
      // ground and a sub-pixel edge disappears on high-density Android screens.
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.lg,
    },
    item: {
      flex: 1,
      borderRadius: (TAB_BAR_HEIGHT - TAB_BAR_INSET * 2) / 2,
      gap: 2,
    },
    itemActive: {
      backgroundColor: colors.accentSoft,
    },
    label: {
      ...font('semibold'),
      fontSize: 11,
    },
  });
