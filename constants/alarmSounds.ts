export const DEFAULT_ALARM_SOUND_ID = 'classic' as const;

export type AlarmSoundId = typeof DEFAULT_ALARM_SOUND_ID;

export type AlarmSoundOption = {
  id: AlarmSoundId;
  label: string;
  fileName?: string;
};

// Keep this array-based structure so we can add more sounds later without
// changing the scheduling API again.
export const ALARM_SOUND_OPTIONS: AlarmSoundOption[] = [
  {
    id: DEFAULT_ALARM_SOUND_ID,
    label: 'Classic Alarm',
    fileName: 'alarm.mp3',
  },
];

export function getAlarmSoundOption(soundId: AlarmSoundId = DEFAULT_ALARM_SOUND_ID) {
  return ALARM_SOUND_OPTIONS.find((sound) => sound.id === soundId) ?? ALARM_SOUND_OPTIONS[0];
}
