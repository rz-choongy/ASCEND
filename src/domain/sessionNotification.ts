import { getGymById, getSelectedClimbGym } from './gymStore';
import { getActiveSession } from './sessionStore';
import { getAccentColorId, getShowSessionNotification } from './settingsStore';
import { ACCENT_PALETTE } from '../ui/tokens/colors';
import type { SessionRow } from './types';

/**
 * Mirrors a live session into an ongoing Android system notification — the "Climbing now"
 * bar you see in the Samsung shade / lock screen while the app is backgrounded. It's the
 * out-of-app twin of the in-app ActiveSessionCard: same label, same "where", same start time.
 *
 * Everything here is best-effort and never throws into its caller. expo-notifications is a
 * native module, so an OTA JS update can land on a binary that predates it; we load it lazily
 * and swallow failures (the same probe-before-you-leap pattern used for the image picker and
 * secure store), so a missing module quietly means "no notification", never a crash.
 *
 * iOS can't tick a live timer in a plain notification (that needs a Live Activity), so the
 * body shows a static start time rather than an elapsed clock. The channel/sticky calls are
 * harmless no-ops on iOS, so there's no platform branching.
 */

const CHANNEL_ID = 'active-session';
const SESSION_TAG = 'active-session'; // data marker so we only ever dismiss our own notification

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule | null> | null = null;
let channelReady = false;

const loadModule = async (): Promise<NotificationsModule | null> => {
  if (!modulePromise) {
    modulePromise = import('expo-notifications').catch(() => null);
  }
  return modulePromise;
};

const ensureChannel = async (Notifications: NotificationsModule): Promise<void> => {
  if (channelReady) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Active session',
    // Low: present in the shade and on the lock screen, but it never buzzes or
    // pops as a heads-up — it's a passive status row, not an alert.
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    showBadge: false,
  });
  channelReady = true;
};

const formatClock = (ms: number): string => {
  const d = new Date(ms);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
};

/** Where it's happening — the gym for a climb, the session title for strength. Mirrors LogScreen. */
const describeWhere = (session: SessionRow): string => {
  if (session.type === 'climb') {
    const byId = session.gym_id ? getGymById(session.gym_id)?.name : null;
    return byId || getSelectedClimbGym()?.name || '';
  }
  return session.title?.trim() || '';
};

const dismiss = async (Notifications: NotificationsModule): Promise<void> => {
  await Notifications.dismissAllNotificationsAsync();
};

/**
 * Reconciles the system notification to the current active session. Idempotent and safe to
 * call as often as you like — it reads the database each time and makes the shade match.
 * Posts a fresh sticky notification (clearing the previous one so the content stays current),
 * or dismisses everything when there's nothing live / the feature or permission is off.
 */
export const syncActiveSessionNotification = async (): Promise<void> => {
  const Notifications = await loadModule();
  if (!Notifications) return;

  try {
    const session = getActiveSession();

    if (!session || !getShowSessionNotification()) {
      await dismiss(Notifications);
      return;
    }

    // Don't prompt here — only reflect a permission the user already granted. The ask is
    // made intentionally from Settings so starting a session never throws up a dialog.
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      await dismiss(Notifications);
      return;
    }

    await ensureChannel(Notifications);

    const accent = ACCENT_PALETTE[getAccentColorId()]?.dark.accent ?? ACCENT_PALETTE.amber.dark.accent;
    const where = describeWhere(session);
    const title = session.type === 'climb' ? 'Climbing now' : 'Strength session';
    const started = `Started ${formatClock(session.started_at)}`;
    const body = where ? `${where} · ${started}` : started;

    // Replace rather than mutate: clear the old one, then post current content. One session
    // is ever live at a time, and this notification is the only thing the app posts.
    await dismiss(Notifications);
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        color: accent,
        sticky: true, // ongoing — can't be swiped away while the session is live
        autoDismiss: false, // and tapping it opens the app without clearing it
        sound: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        data: { tag: SESSION_TAG, sessionId: session.id },
      },
      trigger: null, // show immediately
    });
  } catch {
    // Best-effort: a notification failure must never disrupt logging.
  }
};

/**
 * Asks for the OS notification permission (the Android 13+ runtime prompt), then syncs.
 * Called from the Settings toggle so the ask has an obvious trigger. Returns whether it's granted.
 */
export const requestSessionNotificationPermission = async (): Promise<boolean> => {
  const Notifications = await loadModule();
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    const next = current.granted ? current : await Notifications.requestPermissionsAsync();
    await syncActiveSessionNotification();
    return next.granted;
  } catch {
    return false;
  }
};
