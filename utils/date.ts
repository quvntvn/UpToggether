export function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getDayKey(value: string | Date) {
  const date = startOfDay(value instanceof Date ? value : new Date(value));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatHistoryDateLabel(value: string, locale: string) {
  const date = new Date(value);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDay = startOfDay(date);

  if (targetDay.getTime() === today.getTime()) {
    return locale === 'fr' ? 'Aujourd’hui' : 'Today';
  }

  if (targetDay.getTime() === yesterday.getTime()) {
    return locale === 'fr' ? 'Hier' : 'Yesterday';
  }

  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
