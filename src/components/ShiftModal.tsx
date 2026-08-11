import React, { useState, useEffect } from 'react';
import { Employee, Shift, TimeOffRequest, ShiftPreset } from '../types';
import {
  calculateShiftHours,
  detectConflicts,
  formatTime12h,
  generateRecurringDates,
  RecurringType,
  formatDateISO,
  parseDateISO,
} from '../utils/dateUtils';
import { X, Clock, AlertTriangle, Calendar, Sparkles, Check, MapPin, Coffee, FileText } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Omit<Shift, 'id' | 'employeeId'> & {
    id?: string;
    employeeId?: string;
    employeeName?: string;
    recurringDates?: string[];
  }) => void;
  onDelete?: (shiftId: string) => void;
  editingShift?: Shift | null;
  employees: Employee[];
  shiftPresets: ShiftPreset[];
  allShifts: Shift[];
  timeOffRequests: TimeOffRequest[];
  initialEmployeeId?: string;
  initialDateStr?: string;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingShift,
  employees,
  shiftPresets,
  allShifts,
  timeOffRequests,
  initialEmployeeId,
  initialDateStr,
}) => {
  const [employeeName, setEmployeeName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('07:00');
  const [endTime, setEndTime] = useState<string>('19:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [location, setLocation] = useState<string>('');
  const [isCompressedDay, setIsCompressedDay] = useState<boolean>(false);
  const [isTimeOff, setIsTimeOff] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [colorPreset, setColorPreset] = useState<string>('preset-day');
  const [confirmDeleteShift, setConfirmDeleteShift] = useState(false);

  // Recurring schedule state
  const [recurringType, setRecurringType] = useState<RecurringType>('none');
  const [repeatEndDate, setRepeatEndDate] = useState<string>('');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1]);

  useEffect(() => {
    if (editingShift) {
      const emp = employees.find((e) => e.id === editingShift.employeeId);
      setEmployeeName(emp ? emp.name : '');
      setDate(editingShift.date);
      setStartTime(editingShift.startTime);
      setEndTime(editingShift.endTime);
      setBreakMinutes(editingShift.breakMinutes);
      setLocation(editingShift.location || '');
      setIsCompressedDay(!!editingShift.isCompressedDay);
      setIsTimeOff(!!editingShift.isTimeOff || (editingShift.status === 'time_off' && !editingShift.isCompressedDay));
      setDescription(editingShift.description || editingShift.notes || '');
      setColorPreset(editingShift.colorPreset || 'preset-day');
      setRecurringType('none');
      setRepeatEndDate('');
      const startDateObj = parseDateISO(editingShift.date);
      setWeeklyDays([startDateObj.getDay()]);
    } else {
      const initEmp = employees.find((e) => e.id === initialEmployeeId);
      setEmployeeName(initEmp ? initEmp.name : '');
      const defaultDate = initialDateStr || formatDateISO(new Date());
      setDate(defaultDate);
      setStartTime('07:00');
      setEndTime('19:00');
      setBreakMinutes(30);
      setLocation('');
      setIsCompressedDay(false);
      setIsTimeOff(false);
      setDescription('');
      setColorPreset('preset-day');
      setRecurringType('none');

      const startDateObj = parseDateISO(defaultDate);
      setWeeklyDays([startDateObj.getDay()]);
      const defaultEnd = new Date(startDateObj);
      defaultEnd.setDate(defaultEnd.getDate() + 30);
      setRepeatEndDate(formatDateISO(defaultEnd));
    }
  }, [editingShift, initialEmployeeId, initialDateStr, employees]);

  if (!isOpen) return null;

  const matchedEmployee = employees.find(
    (e) => e.name.toLowerCase() === employeeName.trim().toLowerCase()
  );

  // Apply preset handler
  const handleApplyPreset = (preset: ShiftPreset) => {
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
    setBreakMinutes(preset.breakMinutes);
    setColorPreset(preset.id);
  };

  // Handle Compress Day toggle
  const handleToggleCompressedDay = (checked: boolean) => {
    setIsCompressedDay(checked);
    if (checked) {
      setIsTimeOff(false);
      setStartTime('');
      setEndTime('');
      setBreakMinutes(0);
    } else {
      if (!startTime || !endTime) {
        setStartTime('07:00');
        setEndTime('19:00');
        setBreakMinutes(30);
      }
    }
  };

  // Handle Time Off toggle
  const handleToggleTimeOff = (checked: boolean) => {
    setIsTimeOff(checked);
    if (checked) {
      setIsCompressedDay(false);
      if (!startTime || !endTime) {
        setStartTime('07:00');
        setEndTime('19:00');
        setBreakMinutes(30);
      }
    }
  };

  // Calculate the last day of existing shifts for the selected employee
  const employeeShifts = allShifts.filter(
    (s) =>
      s.id !== editingShift?.id &&
      ((matchedEmployee && s.employeeId === matchedEmployee.id) ||
        (s.employeeName && s.employeeName.toLowerCase() === employeeName.trim().toLowerCase()))
  );

  let latestShiftDateStr: string | null = null;
  if (employeeShifts.length > 0) {
    latestShiftDateStr = employeeShifts.reduce(
      (max, s) => (s.date > max ? s.date : max),
      employeeShifts[0].date
    );
  }

  let dayAfterLastCycleStr: string | null = null;
  if (latestShiftDateStr) {
    const lastDateObj = parseDateISO(latestShiftDateStr);
    if (recurringType === 'rotation_4_4') {
      // 4 Days On / 4 Days Off: 4 working shift days + 4 off days => next cycle starts on last working shift date + 5 days
      const nextCycleObj = new Date(lastDateObj);
      nextCycleObj.setDate(nextCycleObj.getDate() + 5);
      dayAfterLastCycleStr = formatDateISO(nextCycleObj);
    } else {
      // Other cycle types: First available weekday (Mon-Fri) after last shift date
      const nextDayObj = new Date(lastDateObj);
      nextDayObj.setDate(nextDayObj.getDate() + 1);
      while (nextDayObj.getDay() === 0 || nextDayObj.getDay() === 6) {
        nextDayObj.setDate(nextDayObj.getDate() + 1);
      }
      dayAfterLastCycleStr = formatDateISO(nextDayObj);
    }
  }

  const applyStartDate = (newDate: string) => {
    setDate(newDate);
    if (newDate) {
      const startDateObj = parseDateISO(newDate);
      if (recurringType === 'rotation_4_4') {
        const defaultEnd = new Date(startDateObj);
        defaultEnd.setDate(defaultEnd.getDate() + (4 * 8 - 1));
        setRepeatEndDate(formatDateISO(defaultEnd));
      } else if (recurringType !== 'none' && (!repeatEndDate || repeatEndDate < newDate)) {
        const defaultEnd = new Date(startDateObj);
        defaultEnd.setDate(defaultEnd.getDate() + 30);
        setRepeatEndDate(formatDateISO(defaultEnd));
      }
    }
  };

  // Compute recurring dates preview
  const recurringDatesPreview = generateRecurringDates(
    date,
    repeatEndDate,
    recurringType,
    weeklyDays
  );

  // Construct draft shift for live conflict checking
  const draftShift: Shift = {
    id: editingShift?.id || 'draft-id',
    employeeId: matchedEmployee?.id || 'temp-id',
    date,
    startTime: isCompressedDay ? '' : startTime,
    endTime: isCompressedDay ? '' : endTime,
    breakMinutes: isCompressedDay ? 0 : breakMinutes,
    location,
    description: description.trim() || undefined,
    notes: description.trim() || undefined,
    status: (isCompressedDay || isTimeOff) ? 'time_off' : 'scheduled',
    isCompressedDay,
    isTimeOff,
  };

  const conflicts = detectConflicts(
    draftShift,
    allShifts,
    timeOffRequests
  );

  const durationHours = isCompressedDay ? 0 : calculateShiftHours(startTime, endTime, breakMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !date || (!isCompressedDay && (!startTime || !endTime))) return;

    onSave({
      id: editingShift?.id,
      employeeName: employeeName.trim(),
      employeeId: matchedEmployee?.id,
      date,
      startTime: isCompressedDay ? '' : startTime,
      endTime: isCompressedDay ? '' : endTime,
      breakMinutes: isCompressedDay ? 0 : breakMinutes,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      notes: description.trim() || undefined,
      status: (isCompressedDay || isTimeOff) ? 'time_off' : 'scheduled',
      colorPreset,
      isCompressedDay,
      isTimeOff,
      recurringDates: recurringType !== 'none' ? recurringDatesPreview : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingShift ? 'Edit Shift Schedule' : 'Schedule New Shift'}
              </h3>
              <p className="text-xs text-slate-500">Define shift time, department, and assignee</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Presets Quick Pick Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1" />
              Quick Shift Presets
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {shiftPresets.map((preset) => {
                const isSelected = startTime === preset.startTime && endTime === preset.endTime;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">{preset.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {formatTime12h(preset.startTime)} - {formatTime12h(preset.endTime)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Employee & Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Team Member Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="employee-names-list"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Type or select name..."
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                required
              />
              <datalist id="employee-names-list">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Shift Date</label>
                {dayAfterLastCycleStr && (
                  <button
                    type="button"
                    onClick={() => applyStartDate(dayAfterLastCycleStr!)}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    title={`Last shift end date: ${latestShiftDateStr}`}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    After last cycle ({dayAfterLastCycleStr})
                  </button>
                )}
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => applyStartDate(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Start Time, End Time, Break Duration */}
          {isCompressedDay ? (
            <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg text-xs font-semibold text-purple-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-purple-600" />
                Shift times are set to empty for Compress Day (Time Off)
              </span>
              <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded">No Working Hours</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  required={!isCompressedDay}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  required={!isCompressedDay}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Break (Mins)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="15"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Location Field (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 mr-1" />
              Location <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Office, Store #2, Remote, HQ Room 3"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Time Off Option */}
          <div className={`p-3.5 border rounded-xl flex items-center justify-between transition-all ${
            isTimeOff 
              ? 'bg-purple-50/90 border-purple-300 shadow-2xs ring-1 ring-purple-500/20' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isTimeOff ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Time Off</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isTimeOff ? 'bg-purple-200 text-purple-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    Calculates Shift Time
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Mark this entry as Time Off while keeping start & end time to count towards weekly schedule time.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={isTimeOff}
                onChange={(e) => handleToggleTimeOff(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Compress Day Option */}
          <div className={`p-3.5 border rounded-xl flex items-center justify-between transition-all ${
            isCompressedDay 
              ? 'bg-purple-50/90 border-purple-300 shadow-2xs ring-1 ring-purple-500/20' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isCompressedDay ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Compress Day</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isCompressedDay ? 'bg-purple-200 text-purple-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    No Times / 0 Hrs
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Mark this date as a compressed schedule day off with no start or end times.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={isCompressedDay}
                onChange={(e) => handleToggleCompressedDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Description Field (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <FileText className="w-3.5 h-3.5 text-indigo-600 mr-1" />
              Description <span className="text-slate-400 font-normal ml-1">(Optional - Details only, not shown on weekly/monthly panels)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Vacation, Sick Leave, Family Event, Medical Appointment..."
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Duration Summary */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-semibold text-indigo-900">
            <span>Calculated Weekly Schedule Time:</span>
            <span className="text-sm font-bold bg-indigo-200/60 px-2 py-0.5 rounded">
              {isCompressedDay ? '0 Hours (Compress Day)' : isTimeOff ? `${durationHours} Hours (Time Off)` : `${durationHours} Hours`}
            </span>
          </div>

          {/* Recurring Schedule Option */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                Recurring Schedule
              </label>
              {recurringType !== 'none' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {recurringDatesPreview.length} {recurringDatesPreview.length === 1 ? 'shift' : 'shifts'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Repeat Pattern</label>
                <select
                  value={recurringType}
                  onChange={(e) => {
                    const type = e.target.value as RecurringType;
                    setRecurringType(type);
                    if (type !== 'none') {
                      let startDateToUse = date;
                      if (latestShiftDateStr && !editingShift) {
                        const lastDateObj = parseDateISO(latestShiftDateStr);
                        if (type === 'rotation_4_4') {
                          const nextCycleObj = new Date(lastDateObj);
                          nextCycleObj.setDate(nextCycleObj.getDate() + 5);
                          startDateToUse = formatDateISO(nextCycleObj);
                        } else {
                          const nextDayObj = new Date(lastDateObj);
                          nextDayObj.setDate(nextDayObj.getDate() + 1);
                          while (nextDayObj.getDay() === 0 || nextDayObj.getDay() === 6) {
                            nextDayObj.setDate(nextDayObj.getDate() + 1);
                          }
                          startDateToUse = formatDateISO(nextDayObj);
                        }
                        setDate(startDateToUse);
                      }
                      const startDateObj = parseDateISO(startDateToUse || formatDateISO(new Date()));
                      const defaultEnd = new Date(startDateObj);
                      if (type === 'rotation_4_4') {
                        defaultEnd.setDate(defaultEnd.getDate() + (4 * 8 - 1));
                      } else {
                        defaultEnd.setDate(defaultEnd.getDate() + 30);
                      }
                      setRepeatEndDate(formatDateISO(defaultEnd));
                    }
                  }}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="none">Single Shift (No Repeat)</option>
                  <option value="weekly">Weekly (Select days of week)</option>
                  <option value="monthly">Monthly (Every month on same date)</option>
                  <option value="rotation_4_4">4 Days On / 4 Days Off (4 Cycles = 31 Days Span)</option>
                </select>
              </div>

              {recurringType !== 'none' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Repeat End Date</label>
                  <input
                    type="date"
                    min={date}
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}
            </div>

            {recurringType === 'weekly' && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Repeat on Days of Week:
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setWeeklyDays([1, 2, 3, 4, 5])}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline"
                    >
                      Mon–Fri
                    </button>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => setWeeklyDays([1, 2, 3, 4, 5, 6, 0])}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline"
                    >
                      All Days
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { num: 0, label: 'Sun' },
                    { num: 1, label: 'Mon' },
                    { num: 2, label: 'Tue' },
                    { num: 3, label: 'Wed' },
                    { num: 4, label: 'Thu' },
                    { num: 5, label: 'Fri' },
                    { num: 6, label: 'Sat' },
                  ].map((day) => {
                    const isSelected = weeklyDays.includes(day.num);
                    return (
                      <button
                        key={day.num}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (weeklyDays.length > 1) {
                              setWeeklyDays(weeklyDays.filter((d) => d !== day.num));
                            }
                          } else {
                            setWeeklyDays([...weeklyDays, day.num].sort());
                          }
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {recurringType !== 'none' && (
              <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-lg text-xs text-indigo-950 leading-relaxed">
                {recurringType === 'weekly' && (
                  <p>
                    Repeats <strong>weekly</strong> on{' '}
                    <strong>
                      {[
                        { num: 1, label: 'Monday' },
                        { num: 2, label: 'Tuesday' },
                        { num: 3, label: 'Wednesday' },
                        { num: 4, label: 'Thursday' },
                        { num: 5, label: 'Friday' },
                        { num: 6, label: 'Saturday' },
                        { num: 0, label: 'Sunday' },
                      ]
                        .filter((d) => weeklyDays.includes(d.num))
                        .map((d) => d.label)
                        .join(', ')}
                    </strong>{' '}
                    starting on <strong>{date}</strong> until <strong>{repeatEndDate}</strong>.
                  </p>
                )}
                {recurringType === 'monthly' && (
                  <p>
                    Repeats <strong>monthly</strong> on the same date starting on <strong>{date}</strong> until <strong>{repeatEndDate}</strong>.
                  </p>
                )}
                {recurringType === 'rotation_4_4' && (
                  <div>
                    <p>
                      <strong>4 Days On / 4 Days Off:</strong> 4 full cycles (31 days span: {date} to {repeatEndDate}).
                    </p>
                    {dayAfterLastCycleStr && date !== dayAfterLastCycleStr && (
                      <button
                        type="button"
                        onClick={() => applyStartDate(dayAfterLastCycleStr!)}
                        className="mt-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-100/90 hover:bg-indigo-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Set start date to day after last cycle ({dayAfterLastCycleStr})
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-indigo-700 mt-1 font-semibold">
                  Total of {recurringDatesPreview.length} shift{recurringDatesPreview.length === 1 ? '' : 's'} will be scheduled.
                </p>
              </div>
            )}
          </div>

          {/* Conflicts Validation Warning Banner */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-900">
              <div className="font-bold flex items-center space-x-1 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Schedule Warning Detected:</span>
              </div>
              {conflicts.map((c, i) => (
                <p key={i} className="text-[11px] text-rose-800 pl-5">
                  • {c.message}
                </p>
              ))}
            </div>
          )}

          </div>

          {/* Action Footer */}
          <div className="shrink-0 p-4 sm:px-6 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
            {editingShift && onDelete ? (
              confirmDeleteShift ? (
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(editingShift.id);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteShift(false)}
                    className="px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteShift(true)}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors"
                >
                  Delete Shift
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {editingShift ? 'Save Changes' : 'Create Shift'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
