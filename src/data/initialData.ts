import { Employee, Shift, TimeOffRequest, ShiftSwapRequest, ShiftPreset } from '../types';
import { getStartOfWeek, getWeekDays, formatDateISO } from '../utils/dateUtils';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 234-5678',
    avatarBg: 'bg-indigo-600',
  },
  {
    id: 'emp-2',
    name: 'Marcus Vance',
    phone: '+1 (555) 345-6789',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'emp-3',
    name: 'Elena Rostova',
    phone: '+1 (555) 456-7890',
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'emp-4',
    name: 'David Kim',
    phone: '+1 (555) 567-8901',
    avatarBg: 'bg-sky-600',
  },
  {
    id: 'emp-5',
    name: 'Aisha Patel',
    phone: '+1 (555) 678-9012',
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'emp-6',
    name: 'Carlos Mendez',
    phone: '+1 (555) 789-0123',
    avatarBg: 'bg-rose-600',
  },
  {
    id: 'emp-7',
    name: 'Hannah Abbott',
    phone: '+1 (555) 890-1234',
    avatarBg: 'bg-teal-600',
  },
  {
    id: 'emp-8',
    name: 'Jordan Lee',
    phone: '+1 (555) 901-2345',
    avatarBg: 'bg-fuchsia-600',
  },
];

export const SHIFT_PRESETS: ShiftPreset[] = [
  {
    id: 'preset-day',
    label: 'Day Shift (7am - 7pm)',
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 30,
    color: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    id: 'preset-night',
    label: 'Night Shift (7pm - 7am)',
    startTime: '19:00',
    endTime: '07:00',
    breakMinutes: 30,
    color: 'bg-slate-800 text-slate-100 border-slate-700',
  },
];

export function generateInitialShifts(): Shift[] {
  const today = new Date();
  const currentWeekStart = getStartOfWeek(today);
  const weekDays = getWeekDays(currentWeekStart).map(formatDateISO);

  const shifts: Shift[] = [
    // Sarah (Mon - Fri Day Shift)
    {
      id: 'shift-101',
      employeeId: 'emp-1',
      date: weekDays[0],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      location: 'Main HQ',
      notes: 'Morning ops sync at 9 AM',
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-102',
      employeeId: 'emp-1',
      date: weekDays[1],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      location: 'Main HQ',
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-103',
      employeeId: 'emp-1',
      date: weekDays[2],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      location: 'Downtown Branch',
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-104',
      employeeId: 'emp-1',
      date: weekDays[3],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },

    // Marcus (Mon - Fri Day Shift)
    {
      id: 'shift-201',
      employeeId: 'emp-2',
      date: weekDays[0],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-202',
      employeeId: 'emp-2',
      date: weekDays[1],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-203',
      employeeId: 'emp-2',
      date: weekDays[2],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },

    // Elena (Mon, Tue, Thu)
    {
      id: 'shift-301',
      employeeId: 'emp-3',
      date: weekDays[0],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-302',
      employeeId: 'emp-3',
      date: weekDays[1],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-303',
      employeeId: 'emp-3',
      date: weekDays[3],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },

    // David (Night Shift Tue - Fri)
    {
      id: 'shift-401',
      employeeId: 'emp-4',
      date: weekDays[1],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },
    {
      id: 'shift-402',
      employeeId: 'emp-4',
      date: weekDays[2],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },
    {
      id: 'shift-403',
      employeeId: 'emp-4',
      date: weekDays[3],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },
    {
      id: 'shift-404',
      employeeId: 'emp-4',
      date: weekDays[4],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },

    // Aisha (Mon - Thu Day Shift)
    {
      id: 'shift-501',
      employeeId: 'emp-5',
      date: weekDays[0],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-502',
      employeeId: 'emp-5',
      date: weekDays[1],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-503',
      employeeId: 'emp-5',
      date: weekDays[2],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },

    // Carlos (Mon, Wed, Fri)
    {
      id: 'shift-601',
      employeeId: 'emp-6',
      date: weekDays[0],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 60,
      notes: 'Deployment monitoring',
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-602',
      employeeId: 'emp-6',
      date: weekDays[2],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 60,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },
    {
      id: 'shift-603',
      employeeId: 'emp-6',
      date: weekDays[4],
      startTime: '07:00',
      endTime: '19:00',
      breakMinutes: 60,
      status: 'scheduled',
      colorPreset: 'preset-day',
    },

    // Jordan (Night Shift Wed, Thu, Fri)
    {
      id: 'shift-801',
      employeeId: 'emp-8',
      date: weekDays[2],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },
    {
      id: 'shift-802',
      employeeId: 'emp-8',
      date: weekDays[3],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },
    {
      id: 'shift-803',
      employeeId: 'emp-8',
      date: weekDays[4],
      startTime: '19:00',
      endTime: '07:00',
      breakMinutes: 30,
      status: 'scheduled',
      colorPreset: 'preset-night',
    },
  ];

  return shifts;
}

export function generateInitialTimeOffRequests(): TimeOffRequest[] {
  const today = new Date();
  const currentWeekStart = getStartOfWeek(today);
  const weekDays = getWeekDays(currentWeekStart).map(formatDateISO);

  return [
    {
      id: 'timeoff-1',
      employeeId: 'emp-3', // Elena
      startDate: weekDays[2], // Wednesday
      endDate: weekDays[2],
      type: 'personal',
      reason: 'Doctor appointment and personal errand',
      status: 'approved',
      submittedAt: formatDateISO(new Date(today.getTime() - 86400000 * 3)),
    },
    {
      id: 'timeoff-2',
      employeeId: 'emp-7', // Hannah
      startDate: weekDays[4], // Friday
      endDate: weekDays[6], // Sunday
      type: 'vacation',
      reason: 'Family weekend trip',
      status: 'pending',
      submittedAt: formatDateISO(new Date(today.getTime() - 86400000 * 1)),
    },
    {
      id: 'timeoff-3',
      employeeId: 'emp-5', // Aisha
      startDate: weekDays[4], // Friday
      endDate: weekDays[4],
      type: 'sick',
      reason: 'Dental surgery recovery',
      status: 'pending',
      submittedAt: formatDateISO(today),
    },
  ];
}

export function generateInitialShiftSwaps(): ShiftSwapRequest[] {
  const today = new Date();
  return [
    {
      id: 'swap-1',
      requesterShiftId: 'shift-801',
      requesterId: 'emp-8', // Jordan
      targetEmployeeId: 'emp-3', // Elena
      reason: 'Urgent family event on Wednesday evening',
      status: 'pending',
      createdAt: formatDateISO(today),
    },
  ];
}
