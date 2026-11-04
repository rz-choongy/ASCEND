import { Linking } from 'react-native';
import * as Updates from 'expo-updates';
import { showDialog } from './ui';

/**
 * The newest installable APK. scripts/announce-apk.sh sets this and publishes it over
 * the air to older app versions, which can't receive native changes as updates and
 * need the new APK installed instead.
 */
export const LATEST_APK: { version: string; url: string } | null = null;

const parts = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);

export function isNewer(a: string, b: string) {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return false;
}

/** Runtime version is app.json's version (appVersion policy), not the changelog's. */
export function newerApk() {
  const installed = Updates.runtimeVersion;
  return LATEST_APK && installed && isNewer(LATEST_APK.version, installed) ? LATEST_APK : null;
}

export function offerApk(apk: { version: string; url: string }) {
  showDialog(
    'A new app version is out',
    "This one changes the app itself, so it can't update in place. Download and install it over this one; your sessions and gyms stay.",
    [
      { text: 'Later', style: 'cancel' },
      { text: 'Download', onPress: () => void Linking.openURL(apk.url) },
    ]
  );
}
