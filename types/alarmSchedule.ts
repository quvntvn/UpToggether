import type { AlarmSoundId } from '@/constants/alarmSounds';

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
  soundId: AlarmSoundId;
  days: WeeklyAlarmDays;
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

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};
