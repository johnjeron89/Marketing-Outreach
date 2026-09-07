export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  const direction = days > 0 ? 1 : -1;
  
  while (Math.abs(added) < Math.abs(days)) {
    result.setDate(result.getDate() + direction);
    if (isBusinessDay(result)) {
      added += direction;
    }
  }
  return result;
}

export function isInSendWindow(date: Date, startTime: string, endTime: string, timezone: string = 'UTC'): boolean {
  if (!isBusinessDay(date)) return false;

  // Assuming startTime and endTime are in HH:mm format (24h)
  const currentLocaleTime = date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: false });
  const [currentH, currentM] = currentLocaleTime.split(':').map(Number);
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const currentMinutes = currentH * 60 + currentM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function getNextSendTime(startTime: string, endTime: string, timezone: string = 'UTC'): Date {
  const now = new Date();
  let candidate = new Date(now);

  while (true) {
    if (isInSendWindow(candidate, startTime, endTime, timezone)) {
      if (candidate.getTime() > now.getTime()) {
        return candidate;
      }
    }
    
    // Jump forward in 15 minute increments to find next window
    candidate.setMinutes(candidate.getMinutes() + 15);
  }
}
