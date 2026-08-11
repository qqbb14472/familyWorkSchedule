import React, { useState } from 'react';
import { Employee, Shift, TimeOffRequest, ShiftPreset } from '../types';
import {
  formatDateISO,
  getWeekDays,
  formatTime12h,
  calculateShiftHours,
  detectConflicts,
  isDateInRange
} from '../utils/dateUtils';
import {
  Plus,
  AlertTriangle,
  Clock,
  MoreVertical,
  MapPin,
  Trash2,
  Edit2,
  CalendarX,
  UserCheck,
  Building,
  Coffee
} from 'lucide-react';

interface ScheduleGridProps {
  employees: Employee[];
  shifts: Shift[];
  timeOffRequests: TimeOffRequest[];
  shiftPresets: ShiftPreset[];
  currentWeekStart: Date;
  onCellClick: (employeeId: string, dateStr: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onSelectEmployee?: (employee: Employee) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  employees,
  shifts,
  timeOffRequests,
  shiftPresets,
  currentWeekStart,
  onCellClick,
  onEditShift,
  onDeleteShift,
  onSelectEmployee,
  searchQuery,
  setSearchQuery,
}) => {
  const weekDays = getWeekDays(currentWeekStart);
  const todayStr = formatDateISO(new Date());

  // Active dropdown shift popover ID state
  const [activeMenuShiftId, setActiveMenuShiftId] = useState<string | null>(null);

  // Filter employees by search query
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map color preset helper
  const getShiftCardBg = (colorPreset?: string) => {
    switch (colorPreset) {
      case 'preset-day':
      case 'preset-morning':
        return 'bg-amber-50/90 text-amber-950 border-amber-200 hover:border-amber-300';
      case 'preset-night':
      case 'preset-evening':
        return 'bg-slate-800 text-slate-100 border-slate-700 hover:border-slate-600';
      default:
        return 'bg-amber-50/90 text-amber-950 border-amber-200 hover:border-amber-300';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Search & Stats Bar */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Filter employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg pl-3 pr-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Day Shift (7am - 7pm)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
            <span>Night Shift (7pm - 7am)</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px] table-fixed">
          <colgroup>
            <col className="w-40" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-[12.5%]" />
            <col className="w-24" />
          </colgroup>
          {/* Header Row: Days of Week */}
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-left">
              {/* Employee Column Header */}
              <th className="p-3 text-xs font-bold text-slate-700 border-r border-slate-200 truncate">
                Team Member ({filteredEmployees.length})
              </th>

              {/* 7 Days Headers */}
              {weekDays.map((day) => {
                const dayStr = formatDateISO(day);
                const isToday = dayStr === todayStr;
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dayNum = day.getDate();

                return (
                  <th
                    key={dayStr}
                    className={`p-2.5 text-center border-r border-slate-200 ${
                      isToday ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                        {dayName}
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 rounded-full w-7 h-7 flex items-center justify-center ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-800'
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Weekly Total Column Header */}
              <th className="p-3 text-center text-xs font-bold text-slate-700 bg-slate-100/50">
                Total Hours
              </th>
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-slate-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 text-sm">
                  No team members match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                // Calculate weekly total hours for this employee
                const empWeekShifts = shifts.filter((s) => {
                  const sWeekDays = weekDays.map(formatDateISO);
                  return s.employeeId === emp.id && sWeekDays.includes(s.date) && s.status !== 'canceled';
                });

                const totalScheduledHours = empWeekShifts.reduce(
                  (acc, s) => acc + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes),
                  0
                );

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Employee Profile Cell */}
                    <td
                      onClick={() => onSelectEmployee?.(emp)}
                      className="p-3 border-r border-slate-200 bg-white sticky left-0 z-10 cursor-pointer hover:bg-indigo-50/60 transition-colors group"
                      title={`Click to view/manage schedule for ${emp.name}`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-8 h-8 rounded-full ${emp.avatarBg} text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {emp.name}
                          </h4>
                          <span className="text-[10px] text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold block -mt-0.5">
                            View Schedule &rarr;
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells (7 Days) */}
                    {weekDays.map((day) => {
                      const dayStr = formatDateISO(day);
                      const isToday = dayStr === todayStr;

                      // Get shifts for this employee on this date
                      const cellShifts = shifts.filter(
                        (s) => s.employeeId === emp.id && s.date === dayStr && s.status !== 'canceled'
                      );

                      // Check if employee has approved leave on this date
                      const leaveOnDate = timeOffRequests.find(
                        (r) =>
                          r.employeeId === emp.id &&
                          r.status === 'approved' &&
                          isDateInRange(dayStr, r.startDate, r.endDate)
                      );

                      return (
                        <td
                          key={dayStr}
                          onClick={() => {
                            if (cellShifts.length === 0 && !leaveOnDate) {
                              onCellClick(emp.id, dayStr);
                            }
                          }}
                          className={`p-1.5 border-r border-slate-200 align-top relative group min-h-[90px] h-24 transition-colors ${
                            isToday ? 'bg-indigo-50/20' : ''
                          } ${cellShifts.length === 0 ? 'hover:bg-slate-100/60 cursor-pointer' : ''}`}
                        >
                          {/* Approved Leave Indicator */}
                          {leaveOnDate && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-800 text-[11px] font-medium flex items-center space-x-1.5">
                              <CalendarX className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-bold capitalize">{leaveOnDate.type}</span>
                                <p className="text-[10px] text-amber-600 truncate">{leaveOnDate.reason}</p>
                              </div>
                            </div>
                          )}

                          {/* Render Shifts inside cell */}
                          {cellShifts.map((shift) => {
                            const hours = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
                            const conflicts = detectConflicts(shift, shifts, timeOffRequests);

                            return (
                              <div
                                key={shift.id}
                                className={`mb-1 p-2 rounded-lg border text-xs font-medium shadow-2xs relative group/card transition-all ${
                                  shift.isCompressedDay || shift.status === 'time_off'
                                    ? 'bg-purple-50/90 border-purple-300 text-purple-950'
                                    : getShiftCardBg(shift.colorPreset)
                                }`}
                              >
                                {shift.isCompressedDay ? (
                                  <div className="mb-1 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900 text-[10px] font-extrabold">
                                    <Coffee className="w-2.5 h-2.5 shrink-0" />
                                    <span>Compress Day</span>
                                  </div>
                                ) : (shift.isTimeOff || shift.status === 'time_off') ? (
                                  <div className="mb-1 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900 text-[10px] font-extrabold">
                                    <Coffee className="w-2.5 h-2.5 shrink-0" />
                                    <span>Time Off</span>
                                  </div>
                                ) : null}

                                <div className="flex items-center justify-between mb-1">
                                  {shift.isCompressedDay || (!shift.startTime && !shift.endTime) ? (
                                    <span className="font-bold text-[11px] flex items-center gap-1 text-purple-900">
                                      <Coffee className="w-3 h-3 text-purple-700 shrink-0" />
                                      <span>Time Off</span>
                                    </span>
                                  ) : (
                                    <span className="font-bold text-[11px] flex items-center gap-1">
                                      <Clock className="w-3 h-3 opacity-70" />
                                      {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)}
                                    </span>
                                  )}

                                  {/* Shift card actions menu */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuShiftId(activeMenuShiftId === shift.id ? null : shift.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer"
                                    >
                                      <MoreVertical className="w-3 h-3 opacity-70" />
                                    </button>

                                    {activeMenuShiftId === shift.id && (
                                      <div
                                        onMouseLeave={() => setActiveMenuShiftId(null)}
                                        className="absolute right-0 top-5 z-20 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-slate-700 text-xs"
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuShiftId(null);
                                            onEditShift(shift);
                                          }}
                                          className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center cursor-pointer"
                                        >
                                          <Edit2 className="w-3 h-3 mr-1.5 text-indigo-600" />
                                          Edit Shift
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuShiftId(null);
                                            onDeleteShift(shift.id);
                                          }}
                                          className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-rose-600 flex items-center cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3 mr-1.5" />
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] opacity-90">
                                  {shift.location ? (
                                    <span className="font-semibold flex items-center space-x-1 truncate mr-1" title={shift.location}>
                                      <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                      <span className="truncate">{shift.location}</span>
                                    </span>
                                  ) : (
                                    <span />
                                  )}
                                  <span className="font-semibold bg-black/5 px-1.5 py-0.5 rounded shrink-0">
                                    {hours} hrs
                                  </span>
                                </div>

                                {/* Conflict Badge Warning */}
                                {conflicts.length > 0 && (
                                  <div
                                    title={conflicts.map((c) => c.message).join('\n')}
                                    className="mt-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold flex items-center space-x-1"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span className="truncate">{conflicts[0].message}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Quick "+ Shift" hover button when empty */}
                          {cellShifts.length === 0 && !leaveOnDate && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-600 text-white text-[11px] font-semibold shadow-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Weekly Total Column */}
                    <td className="p-3 text-center bg-slate-50/50">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-900">
                          {totalScheduledHours.toFixed(1)} h
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>


        </table>
      </div>
    </div>
  );
};
