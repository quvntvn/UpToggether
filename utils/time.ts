export function formatSeconds(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatReactionTime(seconds: number) {
  if (seconds <= 0) {
    return '0s';
  }

  return formatSeconds(seconds);
}

export function formatScheduledTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function getMockPercentile(reactionSeconds: number) {
  return Math.max(1, Math.min(99, 100 - reactionSeconds * 3));
}

export function getAverageReactionSeconds(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}
