import React, { useState, useMemo } from 'react';
import { Employee, TimeOffRequest, Shift } from '../types';
import {
  Coffee,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Palmtree,
} from 'lucide-react';

interface TimeOffManagerProps {
  timeOffRequests: TimeOffRequest[];
  employees: Employee[];
  shifts?: Shift[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onSubmitRequest?: (request: Omit<TimeOffRequest, 'id' | 'status' | 'submittedAt'>) => void;
}

/**
 * Returns all dates (YYYY-MM-DD) between startDate and endDate inclusive
 */
function getDatesInRange(startDate: string, endDate: string): string[] {
  if (!startDate) return [];
  if (!endDate || startDate === endDate) return [startDate];

  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  if (end < start) return [startDate];

  const dates: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function formatMonthTitle(year: number, monthZeroIndexed: number): string {
  const d = new Date(year, monthZeroIndexed, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatMonthKey(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [year, month] = monthKey.split('-').map(Number);
  return formatMonthTitle(year, month - 1);
}

export const TimeOffManager: React.FC<TimeOffManagerProps> = ({
  timeOffRequests,
  employees,
  shifts = [],
  onApprove,
  onReject,
}) => {
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Month navigation: current month default
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(now.getMonth()); // 0-indexed
  const [viewAllMonths, setViewAllMonths] = useState<boolean>(false);

  const selectedMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const selectedMonthLabel = formatMonthTitle(currentYear, currentMonthIndex);

  const toggleExpand = (empId: string) => {
    setExpandedEmpId((prev) => (prev === empId ? null : empId));
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonthIndex(today.getMonth());
    setViewAllMonths(false);
  };

  // Generate Month Options for dropdown (from 6 months ago to 12 months ahead)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string; year: number; month: number }[] = [];
    const base = new Date();
    for (let offset = -6; offset <= 12; offset++) {
      const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const isCurrent = offset === 0;
      options.push({
        value: key,
        label: `${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}${isCurrent ? ' (Current)' : ''}`,
        year: y,
        month: m,
      });
    }
    return options;
  }, []);

  // Compute stats across all employees for selected month
  const teamMonthStats = useMemo(() => {
    let totalDaysTeam = 0;
    let employeesWithTimeOffCount = 0;
    let pendingRequestsInMonth = 0;

    employees.forEach((emp) => {
      const empShifts = shifts.filter(
        (s) =>
          (s.employeeId === emp.id || s.employeeName === emp.name) &&
          (s.isTimeOff || s.isCompressedDay || s.isHoliday || s.status === 'time_off' || s.status === 'holiday')
      );
      const empRequests = timeOffRequests.filter((r) => r.employeeId === emp.id);
      const approvedReqs = empRequests.filter((r) => r.status === 'approved');
      const pendingReqs = empRequests.filter((r) => r.status === 'pending');

      // Shifts in selected month
      const monthShifts = empShifts.filter((s) => getMonthKey(s.date) === selectedMonthKey);

      // Approved days in selected month
      let approvedDaysInMonth = 0;
      approvedReqs.forEach((r) => {
        const dates = getDatesInRange(r.startDate, r.endDate);
        const count = dates.filter((d) => getMonthKey(d) === selectedMonthKey).length;
        approvedDaysInMonth += count;
      });

      // Pending days in selected month
      pendingReqs.forEach((r) => {
        const dates = getDatesInRange(r.startDate, r.endDate);
        if (dates.some((d) => getMonthKey(d) === selectedMonthKey)) {
          pendingRequestsInMonth += 1;
        }
      });

      const empTotalDaysInMonth = monthShifts.length + approvedDaysInMonth;
      if (empTotalDaysInMonth > 0) {
        employeesWithTimeOffCount += 1;
        totalDaysTeam += empTotalDaysInMonth;
      }
    });

    return {
      totalDaysTeam,
      employeesWithTimeOffCount,
      pendingRequestsInMonth,
    };
  }, [employees, shifts, timeOffRequests, selectedMonthKey]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Month Selector & Controls Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Monthly Time Off Summary
              </h2>
              <p className="text-xs text-slate-500">
                Displaying total time off and scheduled leave by month
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle View Mode: Selected Month vs All Months */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewAllMonths(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                !viewAllMonths
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setViewAllMonths(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewAllMonths
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Months
            </button>
          </div>

          {!viewAllMonths && (
            <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonthKey}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setCurrentYear(y);
                  setCurrentMonthIndex(m - 1);
                }}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleCurrentMonth}
                className="px-2.5 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
              >
                Current
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Month Overview Metrics Cards (when specific month is active) */}
      {!viewAllMonths && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white rounded-2xl p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs opacity-80 font-medium">
              <span>{selectedMonthLabel} Total</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black">
              {teamMonthStats.totalDaysTeam}{' '}
              <span className="text-xs font-semibold opacity-85">
                {teamMonthStats.totalDaysTeam === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-[11px] opacity-75">
              Total time off across all team members in {selectedMonthLabel}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Members on Leave</span>
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {teamMonthStats.employeesWithTimeOffCount}{' '}
              <span className="text-xs font-medium text-slate-500">
                / {employees.length} members
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Team members with time off during {selectedMonthLabel}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Pending Requests</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {teamMonthStats.pendingRequestsInMonth}{' '}
              <span className="text-xs font-medium text-slate-500">
                {teamMonthStats.pendingRequestsInMonth === 1 ? 'request' : 'requests'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Awaiting review touching {selectedMonthLabel}
            </p>
          </div>
        </div>
      )}

      {/* Summary Table by Team Member */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Team Member</th>
                <th className="p-3.5 text-center">
                  {viewAllMonths ? 'Total Time Off (All Time)' : `Time Off (${selectedMonthLabel})`}
                </th>
                <th className="p-3.5">
                  {viewAllMonths ? 'Monthly Breakdown (Per Month)' : `${selectedMonthLabel} Breakdown`}
                </th>
                <th className="p-3.5">
                  {viewAllMonths ? 'All Months Summary' : `Scheduled Dates (${selectedMonthLabel})`}
                </th>
                <th className="p-3.5 text-center">Pending Requests</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No team members found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const empShifts = shifts.filter(
                    (s) =>
                      (s.employeeId === emp.id || s.employeeName === emp.name) &&
                      (s.isTimeOff || s.isCompressedDay || s.isHoliday || s.status === 'time_off' || s.status === 'holiday')
                  );
                  const empRequests = timeOffRequests.filter((r) => r.employeeId === emp.id);

                  const approvedReqs = empRequests.filter((r) => r.status === 'approved');
                  const pendingReqs = empRequests.filter((r) => r.status === 'pending');

                  // --- Aggregate By Month Map ---
                  // Map monthKey -> { total: number, vacation: number, sick: number, compress: number, holiday: number, timeOff: number, personal: number, dates: string[] }
                  const monthMap = new Map<
                    string,
                    {
                      total: number;
                      vacation: number;
                      sick: number;
                      compress: number;
                      holiday: number;
                      timeOff: number;
                      personal: number;
                      dates: string[];
                    }
                  >();

                  const getOrCreateMonth = (mKey: string) => {
                    if (!monthMap.has(mKey)) {
                      monthMap.set(mKey, {
                        total: 0,
                        vacation: 0,
                        sick: 0,
                        compress: 0,
                        holiday: 0,
                        timeOff: 0,
                        personal: 0,
                        dates: [],
                      });
                    }
                    return monthMap.get(mKey)!;
                  };

                  // 1. Process Shifts
                  empShifts.forEach((s) => {
                    const mKey = getMonthKey(s.date);
                    const mObj = getOrCreateMonth(mKey);
                    mObj.total += 1;
                    mObj.dates.push(s.date);
                    if (s.isHoliday || s.status === 'holiday') {
                      mObj.holiday += 1;
                    } else if (s.isCompressedDay) {
                      mObj.compress += 1;
                    } else {
                      mObj.timeOff += 1;
                    }
                  });

                  // 2. Process Approved Requests
                  approvedReqs.forEach((r) => {
                    const dates = getDatesInRange(r.startDate, r.endDate);
                    dates.forEach((d) => {
                      const mKey = getMonthKey(d);
                      const mObj = getOrCreateMonth(mKey);
                      mObj.total += 1;
                      mObj.dates.push(d);
                      if (r.type === 'vacation') mObj.vacation += 1;
                      else if (r.type === 'sick') mObj.sick += 1;
                      else mObj.personal += 1;
                    });
                  });

                  // Selected Month specific metrics
                  const selectedMonthData = monthMap.get(selectedMonthKey) || {
                    total: 0,
                    vacation: 0,
                    sick: 0,
                    compress: 0,
                    holiday: 0,
                    timeOff: 0,
                    personal: 0,
                    dates: [],
                  };

                  // All time total
                  const allTimeTotal = Array.from(monthMap.values()).reduce((sum, item) => sum + item.total, 0);

                  // Sorted list of months for this employee
                  const employeeMonthsSorted = Array.from(monthMap.entries())
                    .filter(([, data]) => data.total > 0)
                    .sort(([a], [b]) => a.localeCompare(b));

                  const isExpanded = expandedEmpId === emp.id;

                  // Scheduled shifts & requests in selected month
                  const empShiftsInSelectedMonth = empShifts.filter(
                    (s) => getMonthKey(s.date) === selectedMonthKey
                  );
                  const approvedReqsInSelectedMonth = approvedReqs.filter((r) => {
                    const dates = getDatesInRange(r.startDate, r.endDate);
                    return dates.some((d) => getMonthKey(d) === selectedMonthKey);
                  });

                  const displayTotalDays = viewAllMonths ? allTimeTotal : selectedMonthData.total;

                  return (
                    <React.Fragment key={emp.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        {/* Team Member */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full ${emp.avatarBg || 'bg-slate-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                            >
                              {emp.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{emp.name}</p>
                              {emp.role && (
                                <p className="text-[10px] text-slate-400">{emp.role}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total Time Off Days (Per Month) */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${
                                displayTotalDays > 0
                                  ? 'bg-purple-100 text-purple-900 border-purple-200 shadow-2xs'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {displayTotalDays} {displayTotalDays === 1 ? 'Day' : 'Days'}
                            </span>
                            {!viewAllMonths && (
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                in {selectedMonthLabel}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Breakdown per Month */}
                        <td className="p-3.5">
                          {!viewAllMonths ? (
                            <div className="flex flex-wrap gap-1 text-[11px]">
                              {selectedMonthData.vacation > 0 && (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold">
                                  Vacation: {selectedMonthData.vacation}d
                                </span>
                              )}
                              {selectedMonthData.sick > 0 && (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200/60 font-semibold">
                                  Sick: {selectedMonthData.sick}d
                                </span>
                              )}
                              {selectedMonthData.holiday > 0 && (
                                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-900 border border-orange-200/70 font-semibold flex items-center gap-1">
                                  <Palmtree className="w-3 h-3 text-orange-600" />
                                  Holiday: {selectedMonthData.holiday}d
                                </span>
                              )}
                              {selectedMonthData.compress > 0 && (
                                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold flex items-center gap-1">
                                  <Coffee className="w-3 h-3 text-purple-600" />
                                  Compress: {selectedMonthData.compress}d
                                </span>
                              )}
                              {selectedMonthData.timeOff > 0 && (
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-semibold">
                                  Time Off: {selectedMonthData.timeOff}d
                                </span>
                              )}
                              {selectedMonthData.personal > 0 && (
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold">
                                  Personal: {selectedMonthData.personal}d
                                </span>
                              )}
                              {selectedMonthData.total === 0 && (
                                <span className="text-slate-400 font-normal italic">
                                  0 days in {selectedMonthLabel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {employeeMonthsSorted.length === 0 ? (
                                <span className="text-slate-400 font-normal italic">No days recorded</span>
                              ) : (
                                employeeMonthsSorted.map(([mKey, data]) => (
                                  <button
                                    key={mKey}
                                    type="button"
                                    onClick={() => {
                                      const [y, m] = mKey.split('-').map(Number);
                                      setCurrentYear(y);
                                      setCurrentMonthIndex(m - 1);
                                      setViewAllMonths(false);
                                    }}
                                    className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                                    title="Click to view this month"
                                  >
                                    {formatMonthKey(mKey)}: <strong className="font-extrabold">{data.total}d</strong>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </td>

                        {/* Scheduled Dates & Monthly Overview */}
                        <td className="p-3.5">
                          {!viewAllMonths ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {empShiftsInSelectedMonth.slice(0, 3).map((s) => (
                                <span
                                  key={s.id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {s.date} {s.isCompressedDay ? '(Compress)' : '(Time Off)'}
                                </span>
                              ))}
                              {approvedReqsInSelectedMonth.slice(0, 2).map((r) => (
                                <span
                                  key={r.id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200"
                                >
                                  {r.startDate}
                                  {r.startDate !== r.endDate ? ` - ${r.endDate}` : ''} ({r.type})
                                </span>
                              ))}
                              {empShiftsInSelectedMonth.length === 0 &&
                                approvedReqsInSelectedMonth.length === 0 && (
                                  <span className="text-slate-400 font-normal italic">
                                    None in {selectedMonthLabel}
                                  </span>
                                )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-600 font-medium">
                              Active in {employeeMonthsSorted.length} {employeeMonthsSorted.length === 1 ? 'month' : 'months'}
                            </div>
                          )}
                        </td>

                        {/* Pending Requests */}
                        <td className="p-3.5 text-center">
                          {pendingReqs.length > 0 ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>{pendingReqs.length} Pending</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>

                        {/* Details Toggle */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => toggleExpand(emp.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                            title="Toggle Details"
                          >
                            <span>{isExpanded ? 'Hide' : 'View'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Row for Details & Pending Requests */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
                              {/* Header inside expand */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                  <User className="w-4 h-4 text-purple-600" />
                                  <span>Time Off Records for {emp.name}</span>
                                </h4>

                                {/* Month-by-month pill bar inside expand */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Monthly Totals:
                                  </span>
                                  {employeeMonthsSorted.length === 0 ? (
                                    <span className="text-[11px] text-slate-400 italic">None</span>
                                  ) : (
                                    employeeMonthsSorted.map(([mKey, data]) => (
                                      <span
                                        key={mKey}
                                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                          mKey === selectedMonthKey
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        {formatMonthKey(mKey)}: {data.total}d
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>

                              {empRequests.length === 0 && empShifts.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">
                                  No time off requests or compress days recorded for this team member.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {/* Formal Requests */}
                                  {empRequests.map((req) => {
                                    const reqDates = getDatesInRange(req.startDate, req.endDate);
                                    const reqMonthKeys = Array.from(new Set(reqDates.map(getMonthKey)));

                                    return (
                                      <div
                                        key={req.id}
                                        className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-900 capitalize text-xs">
                                              {req.type}
                                            </span>
                                            <span className="text-[11px] text-slate-600 font-medium">
                                              {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                                            </span>
                                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                              {reqDates.length} {reqDates.length === 1 ? 'day' : 'days'}
                                            </span>
                                          </div>
                                          {req.reason && (
                                            <p className="text-[11px] text-slate-600 font-normal">
                                              Reason: {req.reason}
                                            </p>
                                          )}
                                          <p className="text-[10px] text-slate-400">
                                            Months affected: {reqMonthKeys.map(formatMonthKey).join(', ')}
                                          </p>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <span
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                              req.status === 'approved'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : req.status === 'rejected'
                                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}
                                          >
                                            {req.status}
                                          </span>

                                          {req.status === 'pending' && (
                                            <div className="flex items-center space-x-1.5 ml-2">
                                              <button
                                                onClick={() => onApprove(req.id)}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer shadow-2xs"
                                              >
                                                Approve
                                              </button>
                                              <button
                                                onClick={() => onReject(req.id)}
                                                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer shadow-2xs"
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Shift Time Off, Compress Days & Holiday Off Days */}
                                  {empShifts.map((s) => {
                                    const isHoliday = s.isHoliday || s.status === 'holiday';
                                    return (
                                      <div
                                        key={s.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                                          isHoliday
                                            ? 'bg-orange-50/70 border-orange-200'
                                            : 'bg-purple-50/70 border-purple-200'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2.5">
                                          <div
                                            className={`p-1.5 rounded-lg ${
                                              isHoliday
                                                ? 'bg-orange-200 text-orange-800'
                                                : 'bg-purple-200 text-purple-800'
                                            }`}
                                          >
                                            {isHoliday ? (
                                              <Palmtree className="w-3.5 h-3.5" />
                                            ) : (
                                              <Coffee className="w-3.5 h-3.5" />
                                            )}
                                          </div>
                                          <div>
                                            <span
                                              className={`font-bold block ${
                                                isHoliday ? 'text-orange-950' : 'text-purple-900'
                                              }`}
                                            >
                                              {isHoliday
                                                ? 'Holiday (Off Day — Hours Counted)'
                                                : s.isCompressedDay
                                                ? 'Compress Day'
                                                : 'Time Off Shift'}
                                            </span>
                                            <span
                                              className={`text-[10px] font-semibold ${
                                                isHoliday ? 'text-orange-700' : 'text-purple-700'
                                              }`}
                                            >
                                              Date: {s.date} ({formatMonthKey(getMonthKey(s.date))})
                                            </span>
                                          </div>
                                        </div>
                                        <span
                                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                                            isHoliday
                                              ? 'bg-orange-200 text-orange-950'
                                              : 'bg-purple-200 text-purple-900'
                                          }`}
                                        >
                                          1 Day ({formatMonthKey(getMonthKey(s.date))})
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
