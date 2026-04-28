// expo-notifications remote push was removed from Expo Go in SDK 53.
// All functions are guarded — notifications work in real APK builds only.

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Expo Go — notifications unavailable, fail silently
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDeadlineReminder(
  id: string,
  title: string,
  course: string,
  fireAt: Date
): Promise<string | null> {
  if (!Notifications) return null;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    await cancelDeadlineReminder(id);

    return await Notifications.scheduleNotificationAsync({
      identifier: `deadline-${id}`,
      content: {
        title: 'Deadline Reminder',
        body: `${title} (${course}) is due soon!`,
        sound: true,
        data: { deadlineId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
        date: fireAt,
      },
    });
  } catch (err) {
    console.warn('[notificationService] schedule error:', err);
    return null;
  }
}

export async function cancelDeadlineReminder(id: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`deadline-${id}`);
  } catch { /* ignore */ }
}

export async function cancelAllReminders(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* ignore */ }
}

export interface DeadlineEvent {
  id: string;
  title: string;
  instructor: string;
  startTime: string;
  dayOfWeek: number;
}

export async function syncDeadlineReminders(events: DeadlineEvent[]): Promise<void> {
  if (!Notifications) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  for (const event of events) {
    const now = new Date();
    const todayJS = now.getDay();
    const targetJS = event.dayOfWeek === 6 ? 0 : event.dayOfWeek + 1;
    let daysUntil = (targetJS - todayJS + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;

    const deadlineDate = new Date(now);
    deadlineDate.setDate(now.getDate() + daysUntil);

    const match = event.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'AM' && h === 12) h = 0;
      if (period === 'PM' && h !== 12) h += 12;
      deadlineDate.setHours(h, m, 0, 0);
    }

    if (deadlineDate <= now) continue;

    const oneDayBefore = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);
    if (oneDayBefore > now) {
      await scheduleDeadlineReminder(`${event.id}-1d`, event.title, event.instructor || 'Class', oneDayBefore);
    }

    const oneHourBefore = new Date(deadlineDate.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > now) {
      await scheduleDeadlineReminder(`${event.id}-1h`, event.title, event.instructor || 'Class', oneHourBefore);
    }
  }
}
