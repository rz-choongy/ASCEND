import { getGymById, getSelectedClimbGym } from './gymStore';
import { formatClockTime } from './dateUtils';
import { getActiveSession, getLastLogAt } from './sessionStore';
import { getAccentColorId, getSessionReminder, getShowSessionNotification } from './settingsStore';
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
// The hourly "Still climbing?" nudge. Its own channel at default importance: unlike the quiet
// status row, it's meant to actually get your attention. A fixed identifier means rescheduling
// replaces it rather than stacking a second timer.
const REMINDER_CHANNEL_ID = 'session-reminder';
const REMINDER_ID = 'session-reminder';
const REMINDER_INTERVAL_S = 60 * 60;

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule | null> | null = null;
let channelReady = false;
let reminderChannelReady = false;
let handlerReady = false;
let lastPosted: { sessionId: string; body: string } | null = null;

const loadModule = async (): Promise<NotificationsModule | null> => {
  if (!modulePromise) {
    modulePromise = import('expo-notifications').catch(() => null);
  }
  return modulePromise;
};

const ensureChannel = async (Notifications: NotificationsModule): Promise<void> => {
  // Without a handler, expo-notifications hides any notification posted while the app is in
  // the foreground — which would drop the "Climbing now" bar whenever a session is started
  // from inside the app. Tell it to list our status row in the shade (but never as a heads-up
  // banner or sound; the in-app card already covers the foreground view).
  if (!handlerReady) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerReady = true;
  }

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
 * Re-arms the "Still climbing?" reminder for an hour from now, repeating hourly until the
 * session ends. Called on every sync -- app open, app close, start, finish -- so the hour
 * always counts from the last time you had the app in hand. Clears it when nothing is live,
 * the setting is off, or permission isn't granted.
 */
const syncReminder = async (
  Notifications: NotificationsModule,
  session: SessionRow | null,
  granted: boolean
): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  // A reminder already in the shade is stale once you've opened the app or ended the session.
  await Notifications.dismissNotificationAsync(REMINDER_ID);
  if (!session || !granted || !getSessionReminder()) return;

  if (!reminderChannelReady) {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Still climbing? reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      showBadge: false,
    });
    reminderChannelReady = true;
  }

  const lastLogAt = getLastLogAt(session.id);
  const what = session.type === 'climb' ? 'climb' : 'set';
  const since = lastLogAt != null ? `Last ${what} logged ${formatClockTime(lastLogAt)}.` : `Started ${formatClockTime(session.started_at)}.`;
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: session.type === 'climb' ? 'Still climbing?' : 'Still training?',
      body: `${since} Tap to finish it at the right time.`,
      data: { tag: REMINDER_ID, sessionId: session.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: REMINDER_INTERVAL_S,
      repeats: true,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
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
    // Don't prompt here — only reflect a permission the user already granted. The ask is
    // made intentionally from Settings so starting a session never throws up a dialog.
    const permission = await Notifications.getPermissionsAsync();

    // Separate try: a reminder failure must not stop the live notification from syncing.
    try {
      await syncReminder(Notifications, session, permission.granted);
    } catch {
      // best-effort
    }

    if (!session || !getShowSessionNotification() || !permission.granted) {
      await dismiss(Notifications);
      lastPosted = null;
      return;
    }

    await ensureChannel(Notifications);

    const accent = ACCENT_PALETTE[getAccentColorId()]?.dark.accent ?? ACCENT_PALETTE.amber.dark.accent;
    const where = describeWhere(session);
    const title = session.type === 'climb' ? 'Climbing now' : 'Strength session';
    const started = `Started ${formatClock(session.started_at)}`;
    const body = where ? `${where} · ${started}` : started;

    // Already showing this exact content for this session — skip the dismiss+repost. Android
    // treats a freshly-posted notification as "new" and re-peeks it, so reposting on every
    // foreground/sync call (even with identical content) caused the shade to pop every time.
    if (lastPosted?.sessionId === session.id && lastPosted?.body === body) {
      return;
    }

    // lastPosted lives in memory, so a cold start (Android killed the app in the background)
    // forgets it and would repost — the same re-peek, just on every fresh launch. Check what's
    // actually in the shade first and adopt our own notification if it already matches.
    const presented = await Notifications.getPresentedNotificationsAsync();
    const ours = presented.find((n) => n.request.content.data?.tag === SESSION_TAG);
    if (
      ours?.request.content.data?.sessionId === session.id &&
      ours.request.content.body === body &&
      ours.request.content.title === title
    ) {
      lastPosted = { sessionId: session.id, body };
      return;
    }

    // Replace rather than mutate: clear the old one, then post current content. One session
    // is ever live at a time; clearing all also drops a shown reminder, which is stale by now.
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
    lastPosted = { sessionId: session.id, body };
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
