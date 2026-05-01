# Release Readiness

ASCEND should keep the product workflow simple: local Expo development, early Expo Go testing, EAS internal builds for device testing, TestFlight or Play testing for wider beta, then production store release.

## Current Repo State

- `eas.json` is present with `development`, `preview`, and `production` build profiles.
- `development` and `preview` builds use internal distribution.
- `production` builds use the `production` update channel and app version auto-increment.
- `submit.production` is present so EAS Submit can be configured without changing release profiles.

## Still Required Before First EAS Build

- Create or sign in to an Expo account.
- Run `npx eas-cli init` or `eas init` from the project root.
- Choose final app identifiers before build credentials are created:
  - iOS bundle identifier, for example `com.yourname.ascend`.
  - Android package name, for example `com.yourname.ascend`.
- Add those identifiers to `app.json`:
  - `expo.ios.bundleIdentifier`
  - `expo.android.package`
- If using development builds, install the dev client with `npx expo install expo-dev-client`.
- For EAS Update, run `eas update:configure` after `eas init` so Expo can add the project update URL and project ID.
- Set up Apple Developer Program and Google Play Console accounts before production submission.

## Build Commands

Use these after account setup and identifiers are in place:

```powershell
npx eas-cli build --profile development --platform ios
npx eas-cli build --profile development --platform android
npx eas-cli build --profile preview --platform all
npx eas-cli build --profile production --platform all
npx eas-cli submit --profile production --platform ios
npx eas-cli submit --profile production --platform android
```

## EAS Update Rules

Use EAS Update for JavaScript and asset changes that are compatible with the native runtime already installed on user devices.

Create a new native build instead of an update when changing:

- Expo SDK or React Native version.
- Native dependencies.
- `app.json` native configuration that affects the binary.
- Permissions, icons, splash configuration, bundle identifiers, package names, or plugins.

## Apple Distribution Options Before Public App Store Release

- Expo Go: fastest early testing. Users install Expo Go and scan the QR code. This avoids App Review, but it is not a real app install and only works while the project remains compatible with Expo Go.
- EAS internal iOS build: no App Review, but testers' iPhones must be registered through Apple provisioning. Best for a small trusted test group.
- TestFlight internal testing: no public App Store listing. Internal testers must be App Store Connect users on the team.
- TestFlight external testing: practical for broader beta testing, but Apple beta review can be required before external testers get access.
- Unlisted App Store app: share by direct link and not searchable, but it still requires App Review.
- Custom Apps through Apple Business Manager or School Manager: private organization distribution, but still uses Apple's review and organization setup.
- Apple Developer Enterprise Program: only for eligible organizations distributing proprietary internal apps to employees. Do not use it for public testers.

## Recommended ASCEND Path

1. Keep using Expo Go while Mode 1 is changing quickly.
2. Add app identifiers and run `eas init`.
3. Install `expo-dev-client` only when Expo Go no longer matches the needed device behavior.
4. Use EAS internal builds for a small iPhone/Android test group.
5. Use TestFlight external testing when non-technical iPhone users need easy install links.
6. Use production store release only after the logging and calendar flows are stable.
