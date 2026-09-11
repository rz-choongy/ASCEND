import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color: string;
  strokeWidth?: number;
};

/** Chevron pointing right, e.g. `M9 6l6 6-6 6` in Direction A's wireframes. */
export const ChevronRightIcon = ({ size = 18, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 6l6 6-6 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </Svg>
);

/** Chevron pointing left, e.g. `M15 6l-6 6 6 6` in Direction A's wireframes. */
export const ChevronLeftIcon = ({ size = 18, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 6l-6 6 6 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </Svg>
);

/** Close / X, used for the ClimbSession header's close control. */
export const CloseIcon = ({ size = 19, color, strokeWidth = 2.2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 5l14 14M19 5 5 19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </Svg>
);

/**
 * Settings gear. Drawn as a 6-tooth cog from straight segments only (flat tooth
 * tops, flat valleys, miter joins) so it reads unmistakably as a gear while
 * staying in the app's angular language rather than the usual soft round cog.
 * The hub is a square, echoing the square-knob motif.
 */
export const SettingsGearIcon = ({ size = 19, color, strokeWidth = 1.6 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.06 9.91 L21.06 14.09 L17.92 14.15 L16.83 16.05 L18.34 18.80 L14.72 20.89 L13.09 18.20 L10.91 18.20 L9.28 20.89 L5.66 18.80 L7.17 16.05 L6.08 14.15 L2.94 14.09 L2.94 9.91 L6.08 9.85 L7.17 7.95 L5.66 5.20 L9.28 3.11 L10.91 5.80 L13.09 5.80 L14.72 3.11 L18.34 5.20 L16.83 7.95 L17.92 9.85 Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    <Rect
      x={9.4}
      y={9.4}
      width={5.2}
      height={5.2}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
    />
  </Svg>
);

/** "View all" chevron, small right-pointing arrow used at list ends. */
export const ArrowRightIcon = ({ size = 13, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
  </Svg>
);

/** Tab bar icon set, canonical per Main.dc.html. */
export const LogTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={4} width={16} height={16} stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
  </Svg>
);

export const CalendarTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={5} width={18} height={16} stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
  </Svg>
);

export const ProgressTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 18 9 11l4 3 8-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
    <Path d="M15 5h6v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" />
  </Svg>
);

/** Mountain-peak footer mark from Settings.dc.html's footer. */
export const MountainMarkIcon = ({ size = 18, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 19l6.5-13 3 6 2.5-4 6 11z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </Svg>
);
