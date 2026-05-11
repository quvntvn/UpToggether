const fs = require('fs');
const path = require('path');

const customAlarmSoundPath = './assets/sounds/alarm.mp3';
const hasCustomAlarmSound = fs.existsSync(path.join(__dirname, customAlarmSoundPath));

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'UpTogether',
  slug: 'UpTogether',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'uptogether',
  userInterfaceStyle: 'automatic',
  // Required by react-native-reanimated 4.x and other Fabric-aware modules.
  // The companion onKeyDown NPE bug is patched via patch-package; see
  // patches/react-native+0.81.5.patch for the fix.
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.quvntvn.UpTogether',
    // Permissions required for reliable wake-up alarms.
    // SCHEDULE_EXACT_ALARM: required on Android 12+ to schedule exact-time notifications (user-grantable).
    // USE_EXACT_ALARM: auto-granted on Android 13+ for genuine alarm-clock apps; survives Doze/App Standby.
    // USE_FULL_SCREEN_INTENT: lets the wake screen take over a locked device when the alarm fires.
    // WAKE_LOCK / VIBRATE / RECEIVE_BOOT_COMPLETED: keep the alarm pipeline alive across reboots.
    permissions: [
      'SCHEDULE_EXACT_ALARM',
      'USE_EXACT_ALARM',
      'USE_FULL_SCREEN_INTENT',
      'WAKE_LOCK',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        sounds: hasCustomAlarmSound ? [customAlarmSoundPath] : [],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    alarmSoundBundled: hasCustomAlarmSound,
    eas: {
      projectId: 'c63ffcdb-a25e-479b-9416-5ef230fc819f',
    },
  },
};
