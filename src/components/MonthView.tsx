import React, { useState } from 'react';
import { Shift, Employee } from '../types';
import { formatDateISO, formatTime24h } from '../utils/dateUtils';
import { getEmployeeColorTheme } from '../utils/employeeColors';
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, Users, MapPin, Coffee, Palmtree } from 'lucide-react';

interface MonthViewProps {
  shifts: Shift[];
  employees: Employee[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onOpenNewShiftModal: () => void;
  onOpenNewShiftModalForDate?: (dateStr: string) => void;
  onEditShift: (shift: Shift) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  shifts,
  employees,
  currentDate,
  setCurrentDate,
  onOpenNewShiftModal,
  onOpenNewShiftModalForDate,
  onEditShift,
}) => {
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month details
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // Sunday = 0

  const monthTitle = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const todayStr = formatDateISO(new Date());

  // Helper to open new shift modal for a specific date
  const handleAddShiftForDate = (dateStr: string) => {
    if (onOpenNewShiftModalForDate) {
      onOpenNewShiftModalForDate(dateStr);
    } else {
      onOpenNewShiftModal();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Month Navigation & Controls */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer transition-colors"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded cursor-pointer transition-colors"
              title="Jump to Today"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer transition-colors"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{monthTitle}</h2>
        </div>

        <button
          onClick={onOpenNewShiftModal}
          className="inline-flex items-center px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Shift
        </button>
      </div>

      {/* Employee Colors Legend Bar */}
      <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-2 shrink-0">
          <Users className="w-3.5 h-3.5 text-slate-500 mr-0.5" />
          <span className="text-xs font-bold text-slate-700">Team Shift Colors:</span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setHighlightedEmployeeId(null)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              highlightedEmployeeId === null
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Show All
          </button>

          {employees.map((emp) => {
            const empTheme = getEmployeeColorTheme(emp.id, employees);
            const isSelected = highlightedEmployeeId === emp.id;

            return (
              <button
                key={emp.id}
                onClick={() => setHighlightedEmployeeId(isSelected ? null : emp.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  empTheme.bg
                } ${empTheme.text} ${empTheme.border} ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 font-extrabold shadow-xs' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${empTheme.badgeBg}`} />
                <span>{emp.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center font-bold text-xs text-slate-600 py-2.5">
        {weekDayNames.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Month Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200">
        {daysArray.map((dateObj, idx) => {
          if (!dateObj) {
            return <div key={`empty-${idx}`} className="bg-slate-50/60 min-h-[150px]" />;
          }

          const dateStr = formatDateISO(dateObj);
          const isToday = dateStr === todayStr;
          const dayShifts = shifts.filter((s) => s.date === dateStr && s.status !== 'canceled');

          return (
            <div
              key={dateStr}
              className={`p-2 min-h-[150px] bg-white hover:bg-slate-50/70 transition-colors flex flex-col justify-between group relative ${
                isToday ? 'bg-indigo-50/20' : ''
              }`}
            >
              {/* Day Header Bar */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-800'
                    }`}
                  >
                    {dateObj.getDate()}
                  </span>
                </div>

                {/* Add Shift button on hover */}
                <button
                  onClick={() => handleAddShiftForDate(dateStr)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                  title="Add shift for this date"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Shifts Cards with Employee Colors, Name, Start & End Time */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[130px] pr-0.5 scrollbar-thin">
                {dayShifts.length === 0 ? (
                  <div className="h-full flex items-center justify-center min-h-[60px]">
                    <span className="text-[10px] text-slate-300 font-medium italic">No shifts</span>
                  </div>
                ) : (
                  dayShifts.map((s) => {
                    const emp = employees.find((e) => e.id === s.employeeId);
                    const empTheme = getEmployeeColorTheme(s.employeeId, employees);
                    const isDimmed = highlightedEmployeeId && highlightedEmployeeId !== s.employeeId;
                    const isNight = s.startTime >= '18:00' || s.endTime === '07:00';

                    const isCompressed = s.isCompressedDay;
                    const isHoliday = s.isHoliday || s.status === 'holiday';
                    const isTimeOff = !isHoliday && (s.isTimeOff || (s.status === 'time_off' && !s.isCompressedDay));
                    const isSpecial = isCompressed || isTimeOff || isHoliday;

                    return (
                      <div
                        key={s.id}
                        onClick={() => onEditShift(s)}
                        className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isHoliday
                            ? 'bg-orange-50 border-orange-300 text-orange-950 hover:bg-orange-100/80'
                            : isSpecial
                            ? 'bg-purple-50 border-purple-300 text-purple-950 hover:bg-purple-100/80'
                            : `${empTheme.bg} ${empTheme.text} ${empTheme.border} ${empTheme.hover}`
                        } ${
                          isDimmed ? 'opacity-30 grayscale-20' : 'opacity-100 shadow-2xs'
                        }`}
                        title={`${emp ? emp.name : 'Employee'}: ${s.startTime ? `${formatTime24h(s.startTime)} - ${formatTime24h(s.endTime)}` : ''} ${isHoliday ? '[Holiday (Off)]' : isCompressed ? '[Compress Day]' : isTimeOff ? '[Time Off]' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1 leading-tight">
                          <div className="flex items-center space-x-1 truncate font-bold">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isHoliday ? 'bg-orange-500' : isSpecial ? 'bg-purple-600' : empTheme.badgeBg}`} />
                            <span className="truncate">{emp ? emp.name : 'Staff'}</span>
                          </div>
                          {isHoliday ? (
                            <Palmtree className="w-3 h-3 text-orange-600 shrink-0" />
                          ) : isSpecial ? (
                            <Coffee className="w-3 h-3 text-purple-700 shrink-0" />
                          ) : isNight ? (
                            <Moon className="w-3 h-3 text-indigo-700 shrink-0" />
                          ) : (
                            <Sun className="w-3 h-3 text-amber-600 shrink-0" />
                          )}
                        </div>

                        {isHoliday && (
                          <div className="text-[10px] font-extrabold text-orange-950 bg-orange-200/80 px-1.5 py-0.2 rounded w-fit my-0.5">
                            Holiday (Off)
                          </div>
                        )}

                        {isCompressed && (
                          <div className="text-[10px] font-extrabold text-purple-800 bg-purple-200/60 px-1.5 py-0.2 rounded w-fit my-0.5">
                            Compress Day
                          </div>
                        )}

                        {isTimeOff && (
                          <div className="text-[10px] font-extrabold text-purple-800 bg-purple-200/60 px-1.5 py-0.2 rounded w-fit my-0.5">
                            Time Off
                          </div>
                        )}

                        {s.startTime && s.endTime ? (
                          <div
                            className="text-[10px] font-semibold opacity-90 pl-2.5 truncate whitespace-nowrap overflow-hidden"
                            title={`${formatTime24h(s.startTime)} – ${formatTime24h(s.endTime)}`}
                          >
                            {formatTime24h(s.startTime)} – {formatTime24h(s.endTime)}
                          </div>
                        ) : null}

                        {s.location && (
                          <div className="text-[10px] font-semibold opacity-85 pl-2.5 flex items-center space-x-1 truncate" title={s.location}>
                            <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            <span className="truncate">{s.location}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
