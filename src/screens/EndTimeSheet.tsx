import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { formatClockTime, formatDuration } from '../domain/dateUtils';
import {
  angleFromPoint,
  clampToRange,
  dialRange,
  hourHandAngle,
  minuteHandAngle,
  snapToMinute,
  stepMinutes,
  sweepMs,
  type DialRange,
} from '../domain/endTimeDial';
import { getLastLogAt, getSessionById, setSessionEndedAt } from '../domain/sessionStore';
import { Button, Chip, font, radius, spacing, useTheme } from '../ui';
import type { ThemeColors } from '../ui/tokens/colors';
import type { Typography } from '../ui/tokens/typography';

const DIAL = 260;
const R = DIAL / 2;
const MIN = 60_000;
// Touches this close to the centre give wild angles; ignore them.
const DEAD_ZONE = 22;
const TICK_EVERY_MS = 5 * MIN;

type Props = {
  sessionId: string;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type Snapshot = {
  startedAt: number;
  originalEnd: number;
  lastLogAt: number | null;
  what: 'climb' | 'set';
  range: DialRange;
};

const polar = (radiusPx: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: R + radiusPx * Math.sin(rad), y: R - radiusPx * Math.cos(rad) };
};

/** Clockwise arc on the face from one angle to another; a full ring when it spans 12 hours. */
const arcPath = (radiusPx: number, fromDeg: number, toDeg: number, full: boolean) => {
  if (full) {
    const top = polar(radiusPx, 0);
    const bottom = polar(radiusPx, 180);
    return `M ${top.x} ${top.y} A ${radiusPx} ${radiusPx} 0 1 1 ${bottom.x} ${bottom.y} A ${radiusPx} ${radiusPx} 0 1 1 ${top.x} ${top.y}`;
  }
  const sweep = (toDeg - fromDeg + 360) % 360;
  const a = polar(radiusPx, fromDeg);
  const b = polar(radiusPx, toDeg);
  return `M ${a.x} ${a.y} A ${radiusPx} ${radiusPx} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
};

/**
 * Fix a finished session's end time on a clock face: drag the minute hand round and the hour
 * hand follows. The shaded arc is the session on the face, start to end. It stops at the last
 * log (and a minute after the start) and at now, with a bump of haptics at each edge.
 */
export const EndTimeSheet = ({ sessionId, visible, onClose, onSaved }: Props) => {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const insets = useSafeAreaInsets();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const session = getSessionById(sessionId);
    if (!session || session.completed_at == null) return;
    const lastLogAt = getLastLogAt(sessionId);
    const range = dialRange(session.started_at, session.completed_at, lastLogAt, Date.now());
    setSnap({
      startedAt: session.started_at,
      originalEnd: session.completed_at,
      lastLogAt,
      what: session.type === 'climb' ? 'climb' : 'set',
      range,
    });
    setValue(clampToRange(session.completed_at, range));
  }, [visible, sessionId]);

  // The pan handler is made once, so it reads the live values through refs.
  const live = useRef({ value, range: snap?.range ?? null });
  live.current = { value, range: snap?.range ?? null };
  const drag = useRef({ x: 0, y: 0, angle: 0, raw: 0, atEdge: false });

  const move = (next: number) => {
    const prev = live.current.value;
    if (next === prev) return;
    if (Math.floor(next / TICK_EVERY_MS) !== Math.floor(prev / TICK_EVERY_MS)) void Haptics.selectionAsync();
    live.current.value = next;
    setValue(next);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          drag.current = { x, y, angle: angleFromPoint(x, y, R, R), raw: live.current.value, atEdge: false };
        },
        onPanResponderMove: (_e, g) => {
          const range = live.current.range;
          if (!range) return;
          const d = drag.current;
          const x = d.x + g.dx;
          const y = d.y + g.dy;
          if (Math.hypot(x - R, y - R) < DEAD_ZONE) return;
          const angle = angleFromPoint(x, y, R, R);
          // Clamp the running total too, so turning back from an edge moves straight away.
          d.raw = clampToRange(d.raw + sweepMs(d.angle, angle), range);
          d.angle = angle;
          const atEdge = d.raw === range.earliest || d.raw === range.latest;
          if (atEdge && !d.atEdge) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          d.atEdge = atEdge;
          move(snapToMinute(d.raw, range));
        },
      }),
    []
  );

  if (!snap) return null;

  const { startedAt, originalEnd, lastLogAt, what, range } = snap;
  const spanFull = value - startedAt >= 12 * 60 * MIN;
  const ringR = R - 50;
  const minuteTip = polar(R - 30, minuteHandAngle(value));
  const hourTip = polar(R * 0.42, hourHandAngle(value));
  const lastDot = lastLogAt != null ? polar(ringR, hourHandAngle(lastLogAt)) : null;
  const startDot = polar(ringR, hourHandAngle(startedAt));

  const save = () => {
    setSessionEndedAt(sessionId, value);
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.grabber} />
          <Text style={styles.title}>When did you finish?</Text>
          <Text style={styles.hint}>
            Started {formatClockTime(startedAt)}
            {lastLogAt != null ? ` · Last ${what} ${formatClockTime(lastLogAt)}` : ''}
          </Text>

          <View style={styles.readout}>
            <Text style={styles.time}>{formatClockTime(value)}</Text>
            <Text style={styles.duration}>{formatDuration(startedAt, value)} session</Text>
          </View>

          <View
            style={styles.dial}
            {...pan.panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="End time"
            accessibilityValue={{ text: formatClockTime(value) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) =>
              move(stepMinutes(value, e.nativeEvent.actionName === 'increment' ? 5 : -5, range))
            }
          >
            <Svg width={DIAL} height={DIAL} pointerEvents="none">
              <Circle cx={R} cy={R} r={R - 1} fill={colors.surfaceAlt} stroke={colors.border} strokeWidth={1} />
              {Array.from({ length: 60 }, (_, i) => {
                const major = i % 5 === 0;
                const a = polar(R - 8, i * 6);
                const b = polar(R - (major ? 18 : 13), i * 6);
                return (
                  <Line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={major ? colors.textSecondary : colors.borderSoft}
                    strokeWidth={major ? 2 : 1}
                    strokeLinecap="round"
                  />
                );
              })}
              {Array.from({ length: 12 }, (_, i) => {
                const p = polar(R - 32, (i + 1) * 30);
                return (
                  <SvgText
                    key={i}
                    x={p.x}
                    y={p.y + 5}
                    fontSize={14}
                    fontWeight="500"
                    fill={colors.textMuted}
                    textAnchor="middle"
                  >
                    {i + 1}
                  </SvgText>
                );
              })}
              {/* The session, start to end, on the 12-hour face. */}
              <Path
                d={arcPath(ringR, hourHandAngle(startedAt), hourHandAngle(value), spanFull)}
                stroke={colors.accentSoft}
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
              />
              <Circle cx={startDot.x} cy={startDot.y} r={4} fill={colors.textSecondary} />
              {lastDot ? <Circle cx={lastDot.x} cy={lastDot.y} r={5} fill={colors.accent} /> : null}
              <G>
                <Line x1={R} y1={R} x2={hourTip.x} y2={hourTip.y} stroke={colors.textPrimary} strokeWidth={6} strokeLinecap="round" />
                <Line x1={R} y1={R} x2={minuteTip.x} y2={minuteTip.y} stroke={colors.action} strokeWidth={3} strokeLinecap="round" />
                <Circle cx={minuteTip.x} cy={minuteTip.y} r={14} fill={colors.action} />
                <Circle cx={R} cy={R} r={6} fill={colors.textPrimary} />
              </G>
            </Svg>
          </View>

          <View style={styles.chips}>
            {/* Only when the last log is the floor; a log right at the start floors a minute later. */}
            {lastLogAt != null && lastLogAt === range.earliest ? (
              <Chip
                label={`Last ${what} ${formatClockTime(lastLogAt)}`}
                selected={value === range.earliest}
                onPress={() => move(range.earliest)}
              />
            ) : null}
            <Chip
              label={`Original ${formatClockTime(originalEnd)}`}
              selected={value === clampToRange(originalEnd, range)}
              onPress={() => move(clampToRange(originalEnd, range))}
            />
          </View>

          <Button label="Save end time" onPress={save} disabled={value === originalEnd} />
          <Button label="Cancel" variant="plain" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      gap: spacing.xs,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.borderSoft,
    },
    title: {
      ...typography.title,
      marginTop: spacing.xxs,
    },
    hint: {
      ...typography.bodyMuted,
      fontSize: 14,
    },
    readout: {
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    time: {
      ...typography.numeric,
      fontSize: 40,
      letterSpacing: -1,
    },
    duration: {
      ...font('medium'),
      fontSize: 15,
      color: colors.accent,
    },
    dial: {
      alignSelf: 'center',
      width: DIAL,
      height: DIAL,
      marginVertical: spacing.xs,
    },
    chips: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
  });
