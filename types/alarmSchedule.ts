import type { AlarmSoundId } from '@/constants/alarmSounds';
import type { Language } from '@/lib/i18n';

export const WEEKDAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type WeekdayKey = (typeof WEEKDAY_ORDER)[number];

export type DailyAlarmConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type WeeklyAlarmDays = Record<WeekdayKey, DailyAlarmConfig>;

export type AlarmSchedule = {
  id: string;
  label: string;
  enabled: boolean;
  skipNextOccurrence: boolean;
  skipNextTimestamp: number | null;
  soundId: AlarmSoundId;
  days: WeeklyAlarmDays;
  oneTimeDate: string | null;
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

export const WEEKDAY_LABELS: Record<Language, Record<WeekdayKey, string>> = {
  en: {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  },
  fr: {
    monday: 'Lun',
    tuesday: 'Mar',
    wednesday: 'Mer',
    thursday: 'Jeu',
    friday: 'Ven',
    saturday: 'Sam',
    sunday: 'Dim',
  },
};

export function getWeekdayLabel(day: WeekdayKey, language: Language) {
  return WEEKDAY_LABELS[language][day] ?? WEEKDAY_LABELS.en[day];
}
