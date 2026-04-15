import { getNextTriggerDate } from '../alarmScheduler';
import type { AlarmSchedule, WeeklyAlarmDays } from '@/types/alarmSchedule';
import { DEFAULT_ALARM_SOUND_ID } from '@/constants/alarmSounds';

const createMockAlarm = (overrides: Partial<AlarmSchedule> = {}): AlarmSchedule => {
  const defaultDays: WeeklyAlarmDays = {
    monday: { enabled: false, hour: 8, minute: 0 },
    tuesday: { enabled: false, hour: 8, minute: 0 },
    wednesday: { enabled: false, hour: 8, minute: 0 },
    thursday: { enabled: false, hour: 8, minute: 0 },
    friday: { enabled: false, hour: 8, minute: 0 },
    saturday: { enabled: false, hour: 8, minute: 0 },
    sunday: { enabled: false, hour: 8, minute: 0 },
  };

  return {
    id: 'test-alarm',
    label: 'Test Alarm',
    enabled: true,
    skipNextOccurrence: false,
    isOneTime: false,
    soundId: DEFAULT_ALARM_SOUND_ID,
    days: defaultDays,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextScheduledTimestamp: null,
    ...overrides,
  };
};

describe('alarmScheduler - getNextTriggerDate', () => {
  // Mock Date: Monday, April 14, 2025, 10:00 AM
  const now = new Date('2025-04-14T10:00:00Z');

  it('returns null if alarm is disabled', () => {
    const alarm = createMockAlarm({ enabled: false });
    alarm.days.monday.enabled = true;
    expect(getNextTriggerDate(alarm, now)).toBeNull();
  });

  it('returns null if no days are enabled', () => {
    const alarm = createMockAlarm();
    expect(getNextTriggerDate(alarm, now)).toBeNull();
  });

  it('schedules for later today if time has not passed', () => {
    const alarm = createMockAlarm();
    alarm.days.monday = { enabled: true, hour: 11, minute: 0 };
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-14T11:00:00Z').toISOString());
  });

  it('schedules for next week if time today has passed and no other days enabled', () => {
    const alarm = createMockAlarm();
    alarm.days.monday = { enabled: true, hour: 9, minute: 0 };
    const nextDate = getNextTriggerDate(alarm, now);
    // Next Monday is April 21
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-21T09:00:00Z').toISOString());
  });

  it('schedules for the next enabled day', () => {
    const alarm = createMockAlarm();
    alarm.days.tuesday = { enabled: true, hour: 8, minute: 0 };
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-15T08:00:00Z').toISOString());
  });

  it('handles skipNextOccurrence for repeating alarms', () => {
    const alarm = createMockAlarm({ skipNextOccurrence: true });
    alarm.days.monday = { enabled: true, hour: 11, minute: 0 };
    alarm.days.tuesday = { enabled: true, hour: 8, minute: 0 };
    const nextDate = getNextTriggerDate(alarm, now);
    // Should skip Monday 11:00 and return Tuesday 08:00
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-15T08:00:00Z').toISOString());
  });

  it('handles skipNextOccurrence for one-time alarms by returning null', () => {
    const alarm = createMockAlarm({ skipNextOccurrence: true, isOneTime: true });
    alarm.days.monday = { enabled: true, hour: 11, minute: 0 };
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate).toBeNull();
  });

  it('handles one-time alarms correctly', () => {
    const alarm = createMockAlarm({ isOneTime: true });
    alarm.days.monday = { enabled: true, hour: 11, minute: 0 };
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-14T11:00:00Z').toISOString());
  });
});
