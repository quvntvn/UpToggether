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
//   2. Adds the permissions required to bypass the keyguard and to keep
//      the CPU awake while the alarm sound loops. The full set of
//      runtime permissions is declared in app.config.js; this plugin
//      only adds permissions that the user must not refuse (system-level).
//
// The notification side of the wake-up flow (setFullScreenIntent) is
// installed by `patches/expo-notifications+0.32.16.patch` via patch-package.
//
// Together, those two pieces produce the "full alarm clock" behavior:
//   - Alarm fires -> notification has a full-screen intent
//   - Android launches MainActivity immediately, bypassing the lockscreen
//   - MainActivity is allowed to show on/turn on the screen
//   - The JS layer (AlarmNotificationBridge) routes to /wake on receipt

const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const REQUIRED_PERMISSIONS = ['android.permission.DISABLE_KEYGUARD'];

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

function applyMainActivityAttributes(androidManifest) {
  const mainActivity = findMainActivity(androidManifest);
  if (!mainActivity) {
    throw new Error(
      'withWakeScreenAndroid: could not locate <activity android:name=".MainActivity"> in AndroidManifest.xml',
    );
  }

  mainActivity.$ = {
    ...mainActivity.$,
    'android:launchMode': 'singleTask',
    'android:showOnLockScreen': 'true',
    'android:showWhenLocked': 'true',
    'android:turnScreenOn': 'true',
  };
}

module.exports = function withWakeScreenAndroid(config) {
  return withAndroidManifest(config, (cfg) => {
    ensurePermissions(cfg.modResults);
    applyMainActivityAttributes(cfg.modResults);
    return cfg;
  });
};
