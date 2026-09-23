import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The tab bar floats above content as a Prism-style pill (see App.tsx), so the
// screens under it must pad their scroll content to clear it.
export const TAB_BAR_HEIGHT = 60;
/** Inner padding between the dock's edge and the active tab's capsule. */
export const TAB_BAR_INSET = 6;
const TAB_BAR_MAX_WIDTH = 300;
const TAB_BAR_GAP = 10;

/** Distance from the screen bottom to the tab bar's bottom edge. */
export const useTabBarBottomOffset = () => {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, TAB_BAR_GAP) + (insets.bottom > 0 ? 0 : 2);
};

/** Side margin that centres the dock at its compact width. */
export const useTabBarSideMargin = () => {
  const { width } = useWindowDimensions();
  return Math.max(16, (width - TAB_BAR_MAX_WIDTH) / 2);
};

/** Bottom padding a tab screen's scroll content needs to scroll fully clear of the bar. */
export const useTabBarClearance = () => useTabBarBottomOffset() + TAB_BAR_HEIGHT + 16;
