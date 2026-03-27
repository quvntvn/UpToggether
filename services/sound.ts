import { Audio, type AVPlaybackSource, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let alarmSound: Audio.Sound | null = null;
let alarmSource: AVPlaybackSource | null | undefined;

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

function resolveAlarmSource() {
  if (alarmSource !== undefined) {
    return alarmSource;
  }

  // Load lazily so route import does not fail if the file is missing.
  try {
    alarmSource = require('../assets/sounds/alarm.mp3');
  } catch (error) {
    console.warn('Alarm sound asset is missing or unreadable at assets/sounds/alarm.mp3.', error);
    alarmSource = null;
  }

  return alarmSource;
}

export async function playAlarmSound() {
  try {
    if (alarmSound) {
      await alarmSound.setPositionAsync(0);
      await alarmSound.playAsync();
      return true;
    }

    const source = resolveAlarmSource();
    if (!source) {
      return false;
    }

    await configureAudioMode();

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      isLooping: true,
      volume: 1,
      progressUpdateIntervalMillis: 250,
    });

    alarmSound = sound;
    return true;
  } catch (error) {
    console.warn('Failed to play alarm sound. Continuing without audio.', error);
    return false;
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
