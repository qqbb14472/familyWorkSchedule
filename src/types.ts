export interface Employee {
  id: string;
  name: string;
  phone?: string;
  avatarBg?: string;
}

export type ShiftStatus = 'scheduled' | 'completed' | 'canceled' | 'time_off';

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  breakMinutes: number;
  location?: string;
  notes?: string;
  description?: string;
  status: ShiftStatus;
  colorPreset?: string;
  isCompressedDay?: boolean;
  isTimeOff?: boolean;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: 'vacation' | 'sick' | 'personal' | 'bereavement';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface ShiftSwapRequest {
  id: string;
  requesterShiftId: string;
  requesterId: string;
  targetEmployeeId?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ShiftConflict {
  type: 'overlap' | 'timeoff' | 'overtime' | 'short_rest';
  severity: 'warning' | 'error';
  message: string;
  shiftId: string;
}

export type ViewMode = 'week' | 'month' | 'timeoff' | 'analysis';

export interface ShiftPreset {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: string;
}
