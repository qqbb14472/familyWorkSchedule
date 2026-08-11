import { Shift, TimeOffRequest, ShiftConflict } from '../types';

export type RecurringType = 'none' | 'weekly' | 'monthly' | 'rotation_4_4';

/**
 * Generate an array of YYYY-MM-DD date strings for recurring schedules
 */
export function generateRecurringDates(
  startDateStr: string,
  endDateStr: string,
  recurringType: RecurringType,
  weeklyDays?: number[]
): string[] {
  if (recurringType === 'none' || !startDateStr) {
    return [startDateStr];
  }

  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const startLocal = new Date(sY, sM - 1, sD);

  if (!endDateStr) {
    return [startDateStr];
  }

  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const endLocal = new Date(eY, eM - 1, eD);

  if (endLocal < startLocal) {
    return [startDateStr];
  }

  const results: string[] = [];

  if (recurringType === 'weekly') {
    let curr = new Date(startLocal);
    const targetDays =
      weeklyDays && weeklyDays.length > 0
        ? weeklyDays
        : [startLocal.getDay()];

    while (curr <= endLocal) {
      if (targetDays.includes(curr.getDay())) {
        results.push(formatDateISO(curr));
      }
      curr.setDate(curr.getDate() + 1);
    }
  } else if (recurringType === 'monthly') {
    let curr = new Date(startLocal);
    const dayOfMonth = startLocal.getDate();
    while (curr <= endLocal) {
      results.push(formatDateISO(curr));
      // Advance 1 month
      const targetMonth = curr.getMonth() + 1;
      const targetYear = curr.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;

      const nextDate = new Date(targetYear, normalizedMonth, dayOfMonth);
      if (nextDate.getMonth() !== normalizedMonth) {
        nextDate.setDate(0);
      }
      curr = nextDate;
    }
  } else if (recurringType === 'rotation_4_4') {
    let curr = new Date(startLocal);
    const startMs = startLocal.getTime();
    while (curr <= endLocal) {
      const diffDays = Math.round((curr.getTime() - startMs) / (1000 * 60 * 60 * 24));
      const cycleIndex = diffDays % 8;
      if (cycleIndex < 4) {
        // First 4 days per every 8 days are working schedule
        results.push(formatDateISO(curr));
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  return results.length > 0 ? results : [startDateStr];
}

/**
 * Format Date object to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD string to local Date object
 */
export function parseDateISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get start of the week (Sunday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day;
  const result = new Date(d);
  result.setDate(diff);
  return result;
}

/**
 * Get array of 7 Date objects representing Monday to Sunday of given week
 */
export function getWeekDays(startOfWeek: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Calculate duration of a shift in decimal hours (subtracting breaks)
 */
export function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number = 30): number {
  if (!startTime || !endTime) return 0;
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);

  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;

  // Handle overnight shifts (e.g., 22:00 to 06:00)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const durationMinutes = endMinutes - startMinutes - breakMinutes;
  return Math.max(0, Number((durationMinutes / 60).toFixed(2)));
}

/**
 * Format 24h time "14:30" to "2:30 PM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minStr = String(m).padStart(2, '0');
  return `${hour12}:${minStr} ${period}`;
}

/**
 * Check if two time ranges overlap on the same day
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [s1H, s1M] = start1.split(':').map(Number);
  const [e1H, e1M] = end1.split(':').map(Number);
  const [s2H, s2M] = start2.split(':').map(Number);
  const [e2H, e2M] = end2.split(':').map(Number);

  let mStart1 = s1H * 60 + s1M;
  let mEnd1 = e1H * 60 + e1M;
  if (mEnd1 <= mStart1) mEnd1 += 24 * 60;

  let mStart2 = s2H * 60 + s2M;
  let mEnd2 = e2H * 60 + e2M;
  if (mEnd2 <= mStart2) mEnd2 += 24 * 60;

  return Math.max(mStart1, mStart2) < Math.min(mEnd1, mEnd2);
}

/**
 * Check if a date falls within a start and end date range (inclusive)
 */
export function isDateInRange(targetDate: string, startDate: string, endDate: string): boolean {
  return targetDate >= startDate && targetDate <= endDate;
}

/**
 * Find conflicts for a specific shift against other shifts and time off requests
 */
export function detectConflicts(
  targetShift: Shift,
  allShifts: Shift[],
  timeOffRequests: TimeOffRequest[]
): ShiftConflict[] {
  const conflicts: ShiftConflict[] = [];

  // 1. Check time off conflict
  const approvedLeaves = timeOffRequests.filter(
    (r) => r.employeeId === targetShift.employeeId && r.status === 'approved'
  );

  for (const leave of approvedLeaves) {
    if (isDateInRange(targetShift.date, leave.startDate, leave.endDate)) {
      conflicts.push({
        type: 'timeoff',
        severity: 'error',
        message: `Employee is on approved ${leave.type} leave (${leave.startDate} to ${leave.endDate}).`,
        shiftId: targetShift.id,
      });
      break;
    }
  }

  // 2. Check overlap with other shifts for same employee on same date
  const employeeSameDayShifts = allShifts.filter(
    (s) => s.id !== targetShift.id && s.employeeId === targetShift.employeeId && s.date === targetShift.date && s.status !== 'canceled'
  );

  for (const s of employeeSameDayShifts) {
    if (doTimesOverlap(targetShift.startTime, targetShift.endTime, s.startTime, s.endTime)) {
      conflicts.push({
        type: 'overlap',
        severity: 'error',
        message: `Overlaps with another shift (${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}).`,
        shiftId: targetShift.id,
      });
      break;
    }
  }

  return conflicts;
}
