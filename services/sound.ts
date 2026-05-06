import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

let alarmPlayer: AudioPlayer | null = null;
let alarmSource: number | null | undefined;
let isAudioModeConfigured = false;

async function configureAudioMode() {
  if (isAudioModeConfigured) {
    return;
  }

  await setAudioModeAsync({
    allowsRecording: false,
    shouldPlayInBackground: true,
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    interruptionModeAndroid: 'doNotMix',
    shouldRouteThroughEarpiece: false,
  });

  isAudioModeConfigured = true;
}

function resolveAlarmSource() {
  if (alarmSource !== undefined) {
    return alarmSource;
  }

  // Load lazily so route import does not fail if the file is missing.
  try {
    alarmSource = require('../assets/sounds/alarm.mp3') as number;
  } catch (error) {
    console.warn('Alarm sound asset is missing or unreadable at assets/sounds/alarm.mp3.', error);
    alarmSource = null;
  }

  return alarmSource;
}

export async function playAlarmSound() {
  try {
    if (alarmPlayer) {
      if (alarmPlayer.playing) {
        return true;
      }

      alarmPlayer.loop = true;
      await alarmPlayer.seekTo(0);
      alarmPlayer.play();
      return true;
    }

    const source = resolveAlarmSource();
    if (!source) {
      return false;
    }

    await configureAudioMode();
    await setIsAudioActiveAsync(true);

    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 1;
    player.play();

    alarmPlayer = player;
    return true;
  } catch (error) {
    console.warn('Failed to play alarm sound. Continuing without audio.', error);
    return false;
  }
}

export async function stopAlarmSound() {
  if (!alarmPlayer) {
    return;
  }

  const player = alarmPlayer;
  alarmPlayer = null;

  try {
    player.pause();
  } catch (error) {
    console.warn('Failed to pause alarm playback cleanly.', error);
  }

  try {
    player.remove();
  } catch (error) {
    console.warn('Failed to release alarm sound.', error);
  }

  try {
    await setIsAudioActiveAsync(false);
  } catch (error) {
    console.warn('Failed to deactivate audio session.', error);
  }
}
