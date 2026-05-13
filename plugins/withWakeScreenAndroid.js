// Expo config plugin: turn UpTogether into a true wake-up app on Android.
//
// What this plugin does at prebuild time:
//   1. Adds <activity> attributes to MainActivity so it can take over the
//      screen even when the device is locked:
//        - android:showOnLockScreen="true"   (legacy, API < 27)
//        - android:turnScreenOn="true"       (API 27+)
//        - android:showWhenLocked="true"     (API 27+)
//        - android:launchMode="singleTask"   (resume an existing instance
//                                             instead of stacking new ones,
//                                             so the wake screen is one tap)
//   2. Adds an <intent-filter> declaring android.intent.action.SET_ALARM
//      on MainActivity. On Android 14+, USE_FULL_SCREEN_INTENT is an
//      appop permission that the system auto-grants only to apps it
//      recognises as alarm clocks or calling apps. The SET_ALARM filter
//      is what makes that recognition happen. Without this, the system
//      silently downgrades setFullScreenIntent() to a normal notification
//      (the exact "I just see a banner" symptom).
//   3. Adds the permissions required to bypass the keyguard.
//
// The notification side of the wake-up flow (setFullScreenIntent) is
// installed by `patches/expo-notifications+0.32.16.patch` via patch-package.
//
// Together, those pieces produce the "full alarm clock" behaviour:
//   - SET_ALARM filter => Android auto-grants USE_FULL_SCREEN_INTENT
//   - Notification carries a full-screen intent
//   - Android launches MainActivity immediately, bypassing the lockscreen
//   - MainActivity is allowed to show on/turn on the screen
//   - The JS layer (AlarmNotificationBridge) routes to /wake on receipt

const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const REQUIRED_PERMISSIONS = ['android.permission.DISABLE_KEYGUARD'];
const SET_ALARM_ACTION = 'android.intent.action.SET_ALARM';

function ensurePermissions(androidManifest) {
  for (const permission of REQUIRED_PERMISSIONS) {
    AndroidConfig.Permissions.addPermission(androidManifest, permission);
  }
}

function findMainActivity(androidManifest) {
  const application = androidManifest.manifest.application?.[0];
  if (!application) {
    return null;
  }

  return application.activity?.find((activity) => activity.$?.['android:name'] === '.MainActivity') ?? null;
}

function applyMainActivityAttributes(mainActivity) {
  mainActivity.$ = {
    ...mainActivity.$,
    'android:launchMode': 'singleTask',
    'android:showOnLockScreen': 'true',
    'android:showWhenLocked': 'true',
    'android:turnScreenOn': 'true',
  };
}

function ensureSetAlarmIntentFilter(mainActivity) {
  mainActivity['intent-filter'] = mainActivity['intent-filter'] ?? [];

  const alreadyDeclared = mainActivity['intent-filter'].some((filter) => {
    const actions = filter.action ?? [];
    return actions.some((action) => action.$?.['android:name'] === SET_ALARM_ACTION);
  });

  if (alreadyDeclared) {
    return;
  }

  mainActivity['intent-filter'].push({
    action: [
      { $: { 'android:name': SET_ALARM_ACTION } },
    ],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
    ],
  });
}

module.exports = function withWakeScreenAndroid(config) {
  return withAndroidManifest(config, (cfg) => {
    ensurePermissions(cfg.modResults);

    const mainActivity = findMainActivity(cfg.modResults);
    if (!mainActivity) {
      throw new Error(
        'withWakeScreenAndroid: could not locate <activity android:name=".MainActivity"> in AndroidManifest.xml',
      );
    }

    applyMainActivityAttributes(mainActivity);
    ensureSetAlarmIntentFilter(mainActivity);

    return cfg;
  });
};
