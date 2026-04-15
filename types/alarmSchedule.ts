import type { AlarmSoundId } from '@/constants/alarmSounds';
import type { Language } from '@/lib/i18n';

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export type WeekdayKey = (typeof WEEKDAY_ORDER)[number];

export type AlarmSchedule = {
  id: string;
  label: string;
  enabled: boolean;
  skipNextOccurrence: boolean;
  isOneTime: boolean;
  soundId: AlarmSoundId;
  hour: number;
  minute: number;
  repeatDays: WeekdayKey[];
  createdAt: string;
  updatedAt: string;
  nextScheduledTimestamp: number | null;
  notificationId?: string;
};

export type NextUpcomingSchedule = {
  schedule: AlarmSchedule;
  occurrence: {
    date: Date;
    day: WeekdayKey;
    formattedTime: string;
  };
};

const WEEKDAY_LABELS: Record<Language, Record<number, string>> = {
  en: {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    0: 'Sun',
  },
  fr: {
    1: 'Lun',
    2: 'Mar',
    3: 'Mer',
    4: 'Jeu',
    5: 'Ven',
    6: 'Sam',
    0: 'Dim',
  },
};

export function getWeekdayLabel(day: number, language: Language) {
  const langLabels = WEEKDAY_LABELS[language] ?? WEEKDAY_LABELS.en;
  return langLabels[day] ?? WEEKDAY_LABELS.en[day] ?? '';
}
