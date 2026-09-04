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
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Settings sliders/equalizer glyph from Main.dc.html's icon-btn. */
export const SettingsSlidersIcon = ({ size = 19, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6h9M17 6h3M4 12h3M9 12h11M4 18h13M21 18h-1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x={9} y={4} width={4} height={4} fill={color} stroke="none" />
    <Rect x={3} y={10} width={4} height={4} fill={color} stroke="none" />
    <Rect x={15} y={16} width={4} height={4} fill={color} stroke="none" />
  </Svg>
);

/** "View all" chevron, small right-pointing arrow used at list ends. */
export const ArrowRightIcon = ({ size = 13, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** Tab bar icon set, canonical per Main.dc.html. */
export const LogTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={4} width={16} height={16} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CalendarTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={5} width={18} height={16} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProgressTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 18 9 11l4 3 8-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 5h6v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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
