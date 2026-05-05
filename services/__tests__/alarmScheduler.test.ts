import { getNextTriggerDate } from '../alarmScheduler';
import type { AlarmSchedule } from '@/types/alarmSchedule';
import { DEFAULT_ALARM_SOUND_ID } from '@/constants/alarmSounds';

const createMockAlarm = (overrides: Partial<AlarmSchedule> = {}): AlarmSchedule => {
  return {
    id: 'test-alarm',
    label: 'Test Alarm',
    enabled: true,
    skipNextOccurrence: false,
    skipNextTimestamp: null,
    isOneTime: false,
    oneTimeDate: null,
    soundId: DEFAULT_ALARM_SOUND_ID,
    hour: 8,
    minute: 0,
    repeatDays: [],
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
    const alarm = createMockAlarm({ enabled: false, repeatDays: [1] });
    expect(getNextTriggerDate(alarm, now)).toBeNull();
  });

  it('returns null if no days are enabled for repeating alarm', () => {
    const alarm = createMockAlarm({ repeatDays: [] });
    expect(getNextTriggerDate(alarm, now)).toBeNull();
  });

  it('schedules for later today if time has not passed', () => {
    const alarm = createMockAlarm({ repeatDays: [1], hour: 11, minute: 0 });
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-14T11:00:00Z').toISOString());
  });

  it('schedules for next week if time today has passed and no other days enabled', () => {
    const alarm = createMockAlarm({ repeatDays: [1], hour: 9, minute: 0 });
    const nextDate = getNextTriggerDate(alarm, now);
    // Next Monday is April 21
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-21T09:00:00Z').toISOString());
  });

  it('schedules for the next enabled day', () => {
    const alarm = createMockAlarm({ repeatDays: [2], hour: 8, minute: 0 });
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-15T08:00:00Z').toISOString());
  });

  it('handles skipNextOccurrence for repeating alarms', () => {
    const alarm = createMockAlarm({ skipNextOccurrence: true, repeatDays: [1, 2], hour: 11, minute: 0 });
    // Monday 11:00 is candidate 1, Tuesday 11:00 is candidate 2 (if we ignore Monday 11:00)
    // Actually we need to be careful with the second candidate.
    // If repeatDays: [1, 2], hour: 11:00
    // Monday 11:00 (Today)
    // Tuesday 11:00 (Tomorrow)
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-15T11:00:00Z').toISOString());
  });

  it('handles skipNextOccurrence for one-time alarms by returning null', () => {
    const alarm = createMockAlarm({ skipNextOccurrence: true, isOneTime: true, repeatDays: [1], hour: 11, minute: 0 });
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate).toBeNull();
  });

  it('handles one-time alarms correctly', () => {
    const alarm = createMockAlarm({ isOneTime: true, hour: 11, minute: 0 });
    const nextDate = getNextTriggerDate(alarm, now);
    expect(nextDate?.toISOString()).toBe(new Date('2025-04-14T11:00:00Z').toISOString());
  });
});
