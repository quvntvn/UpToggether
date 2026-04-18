import { type WeekdayKey, WEEKDAY_ORDER, getWeekdayLabel } from '@/types/alarmSchedule';
import { type Language } from '@/lib/i18n';

const SHORT_LABELS: Record<string, Record<number, string>> = {
  en: { 1: 'M', 2: 'T', 3: 'W', 4: 'T', 5: 'F', 6: 'S', 0: 'S' },
  fr: { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 0: 'D' },
};

/**
 * Formats repeat days into a short string like "L M M J V" or "M T W T F".
 */
export function formatRepeatDaysShort(repeatDays: WeekdayKey[], language: Language): string {
  return WEEKDAY_ORDER
    .filter((day) => repeatDays.includes(day))
    .map((day) => SHORT_LABELS[language]?.[day] || SHORT_LABELS.en[day] || '')
    .join(' ');
}

/**
 * Returns a readable label for the repeat days (e.g., "Every day", "Weekdays", "Mon, Wed").
 */
export function getReadableRepeatLabel(repeatDays: WeekdayKey[], language: Language, isOneTime?: boolean): string {
  if (repeatDays.length === 0) {
    return isOneTime
      ? language === 'fr' ? 'Une seule fois' : 'Once'
      : language === 'fr' ? 'Aucun jour' : 'No days';
  }

  if (repeatDays.length === 7) {
    return language === 'fr' ? 'Tous les jours' : 'Every day';
  }

  const sortedDays = [...repeatDays].sort((a, b) => {
    return WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b);
  });

  const isWeekdays =
    repeatDays.length === 5 && [1, 2, 3, 4, 5].every((d) => repeatDays.includes(d as WeekdayKey));
  if (isWeekdays) {
    return language === 'fr' ? 'Semaine' : 'Weekdays';
  }

  const isWeekends =
    repeatDays.length === 2 && [6, 0].every((d) => repeatDays.includes(d as WeekdayKey));
  if (isWeekends) {
    return language === 'fr' ? 'Week-end' : 'Weekends';
  }

  return sortedDays.map((day) => getWeekdayLabel(day, language)).join(', ');
}
