import { Audio, type AVPlaybackSource, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let alarmSound: Audio.Sound | null = null;

const ALARM_SOURCE: AVPlaybackSource = require('../assets/sounds/alarm.mp3');

async function configureAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: false,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    playThroughEarpieceAndroid: false,
  });
}

export async function playAlarmSound() {
  try {
    if (alarmSound) {
      await alarmSound.setPositionAsync(0);
      await alarmSound.playAsync();
      return;
    }

    await configureAudioMode();

    const { sound } = await Audio.Sound.createAsync(ALARM_SOURCE, {
      shouldPlay: true,
      isLooping: true,
      volume: 1,
      progressUpdateIntervalMillis: 250,
    });

    alarmSound = sound;
  } catch (error) {
    console.error('Failed to play alarm sound.', error);
    throw error;
  }
}

export async function stopAlarmSound() {
  if (!alarmSound) {
    return;
  }

  try {
    await alarmSound.stopAsync();
  } catch (error) {
    console.warn('Failed to stop alarm playback cleanly.', error);
  }

  try {
    await alarmSound.unloadAsync();
  } catch (error) {
    console.warn('Failed to unload alarm sound.', error);
  }

  alarmSound = null;
}
