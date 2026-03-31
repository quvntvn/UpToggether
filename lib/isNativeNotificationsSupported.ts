import { Platform } from 'react-native';

export const isNativeNotificationsSupported = Platform.OS !== 'web';
