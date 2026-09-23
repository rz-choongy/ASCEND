import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color: string;
  strokeWidth?: number;
};

/** Disclosure chevron, matching SF Symbols' `chevron.right`. */
export const ChevronRightIcon = ({ size = 18, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 6l6 6-6 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Back chevron, matching SF Symbols' `chevron.left`. */
export const ChevronLeftIcon = ({ size = 18, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 6l-6 6 6 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
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

/**
 * Settings gear. A 6-tooth cog with rounded joins and a round hub, matching the
 * weight and shape language of SF Symbols' `gearshape`.
 */
export const SettingsGearIcon = ({ size = 19, color, strokeWidth = 1.6 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.06 9.91 L21.06 14.09 L17.92 14.15 L16.83 16.05 L18.34 18.80 L14.72 20.89 L13.09 18.20 L10.91 18.20 L9.28 20.89 L5.66 18.80 L7.17 16.05 L6.08 14.15 L2.94 14.09 L2.94 9.91 L6.08 9.85 L7.17 7.95 L5.66 5.20 L9.28 3.11 L10.91 5.80 L13.09 5.80 L14.72 3.11 L18.34 5.20 L16.83 7.95 L17.92 9.85 Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={2.9} stroke={color} strokeWidth={strokeWidth} fill="none" />
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
    <Rect x={4} y={4} width={16} height={16} rx={4} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CalendarTabIcon = ({ size = 20, color, strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={5} width={18} height={16} rx={4} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Favourite star; `filled` for a starred item. */
export const StarIcon = ({ size = 18, color, strokeWidth = 1.8, filled = false }: IconProps & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);

/** Horizontal ellipsis, for a row's secondary actions. */
export const MoreIcon = ({ size = 18, color }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={5.5} cy={12} r={1.6} fill={color} />
    <Circle cx={12} cy={12} r={1.6} fill={color} />
    <Circle cx={18.5} cy={12} r={1.6} fill={color} />
  </Svg>
);

/** Magnifying glass for search fields. */
export const SearchIcon = ({ size = 16, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={strokeWidth} />
    <Path d="M16 16l4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

/** Dumbbell, for strength sessions alongside the climb mountain. */
export const DumbbellIcon = ({ size = 18, color, strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Sun, matching SF Symbols' `sun.max` -- the light-mode side of the theme toggle. */
export const SunIcon = ({ size = 17, color, strokeWidth = 1.7 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={4.2} stroke={color} strokeWidth={strokeWidth} fill="none" />
    <Path
      d="M12 2.6v2.1M12 19.3v2.1M4.36 4.36l1.49 1.49M18.15 18.15l1.49 1.49M2.6 12h2.1M19.3 12h2.1M4.36 19.64l1.49-1.49M18.15 5.85l1.49-1.49"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Crescent moon, matching SF Symbols' `moon` -- the dark-mode side of the theme toggle. */
export const MoonIcon = ({ size = 17, color, strokeWidth = 1.7 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.4 14.5A8.6 8.6 0 0 1 9.5 3.6a8.6 8.6 0 1 0 10.9 10.9z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
