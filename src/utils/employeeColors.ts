export interface EmployeeColorTheme {
  name: string;
  bg: string;
  text: string;
  border: string;
  hover: string;
  badgeBg: string;
  badgeText: string;
  accentDot: string;
  ring: string;
}

export const EMPLOYEE_COLOR_PALETTES: EmployeeColorTheme[] = [
  {
    name: 'Indigo',
    bg: 'bg-indigo-50/90',
    text: 'text-indigo-950',
    border: 'border-indigo-200',
    hover: 'hover:bg-indigo-100/90',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    accentDot: 'bg-indigo-500',
    ring: 'ring-indigo-400',
  },
  {
    name: 'Emerald',
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-950',
    border: 'border-emerald-200',
    hover: 'hover:bg-emerald-100/90',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    accentDot: 'bg-emerald-500',
    ring: 'ring-emerald-400',
  },
  {
    name: 'Purple',
    bg: 'bg-purple-50/90',
    text: 'text-purple-950',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100/90',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    accentDot: 'bg-purple-500',
    ring: 'ring-purple-400',
  },
  {
    name: 'Sky',
    bg: 'bg-sky-50/90',
    text: 'text-sky-950',
    border: 'border-sky-200',
    hover: 'hover:bg-sky-100/90',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    accentDot: 'bg-sky-500',
    ring: 'ring-sky-400',
  },
  {
    name: 'Amber',
    bg: 'bg-amber-50/90',
    text: 'text-amber-950',
    border: 'border-amber-200',
    hover: 'hover:bg-amber-100/90',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    accentDot: 'bg-amber-500',
    ring: 'ring-amber-400',
  },
  {
    name: 'Rose',
    bg: 'bg-rose-50/90',
    text: 'text-rose-950',
    border: 'border-rose-200',
    hover: 'hover:bg-rose-100/90',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    accentDot: 'bg-rose-500',
    ring: 'ring-rose-400',
  },
  {
    name: 'Teal',
    bg: 'bg-teal-50/90',
    text: 'text-teal-950',
    border: 'border-teal-200',
    hover: 'hover:bg-teal-100/90',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    accentDot: 'bg-teal-500',
    ring: 'ring-teal-400',
  },
  {
    name: 'Fuchsia',
    bg: 'bg-fuchsia-50/90',
    text: 'text-fuchsia-950',
    border: 'border-fuchsia-200',
    hover: 'hover:bg-fuchsia-100/90',
    badgeBg: 'bg-fuchsia-600',
    badgeText: 'text-white',
    accentDot: 'bg-fuchsia-500',
    ring: 'ring-fuchsia-400',
  },
];

export function getEmployeeColorTheme(employeeId: string, employeesList?: { id: string }[]): EmployeeColorTheme {
  if (!employeeId) return EMPLOYEE_COLOR_PALETTES[0];

  if (employeesList && employeesList.length > 0) {
    const idx = employeesList.findIndex((e) => e.id === employeeId);
    if (idx !== -1) {
      return EMPLOYEE_COLOR_PALETTES[idx % EMPLOYEE_COLOR_PALETTES.length];
    }
  }

  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash = employeeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const pos = Math.abs(hash) % EMPLOYEE_COLOR_PALETTES.length;
  return EMPLOYEE_COLOR_PALETTES[pos];
}
