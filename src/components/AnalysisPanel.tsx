import React, { useState, useMemo } from 'react';
import { Employee, Shift } from '../types';
import { calculateShiftHours, formatDateISO, parseDateISO, getStartOfWeek } from '../utils/dateUtils';
import {
  BarChart2,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  Building2,
  FileText,
} from 'lucide-react';

interface AnalysisPanelProps {
  shifts: Shift[];
  employees: Employee[];
  currentWeekStart: Date;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  shifts,
  employees,
  currentWeekStart,
}) => {
  // Filters State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('has_location'); // 'has_location' | 'all' | specific location
  const [timeframeType, setTimeframeType] = useState<'weekly' | 'monthly'>('weekly');
  
  // Active date anchor (defaults to currentWeekStart)
  const [anchorDate, setAnchorDate] = useState<Date>(currentWeekStart);

  // Extract unique locations from all shifts (non-empty strings)
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => {
      if (s.location && s.location.trim() !== '') {
        set.add(s.location.trim());
      }
    });
    return Array.from(set).sort();
  }, [shifts]);

  // Derive Week or Month Date Range (startIso and endIso)
  const { startIso, endIso, periodLabel } = useMemo(() => {
    if (timeframeType === 'weekly') {
      const wStart = getStartOfWeek(anchorDate);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);

      const startIso = formatDateISO(wStart);
      const endIso = formatDateISO(wEnd);

      const startStr = wStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = wEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      return {
        startIso,
        endIso,
        periodLabel: `Week of ${startStr} – ${endStr}`,
      };
    } else {
      // Monthly
      const year = anchorDate.getFullYear();
      const month = anchorDate.getMonth();

      const mStart = new Date(year, month, 1);
      const mEnd = new Date(year, month + 1, 0); // last day of month

      const startIso = formatDateISO(mStart);
      const endIso = formatDateISO(mEnd);

      const periodLabel = anchorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      return {
        startIso,
        endIso,
        periodLabel,
      };
    }
  }, [timeframeType, anchorDate]);

  // Filter matching shifts
  const matchingShifts = useMemo(() => {
    return shifts.filter((s) => {
      // Exclude canceled or time off shifts
      if (s.status === 'canceled' || s.isTimeOff) return false;

      // Date range check
      if (s.date < startIso || s.date > endIso) return false;

      // Employee check
      if (selectedEmployeeId !== 'all' && s.employeeId !== selectedEmployeeId) return false;

      // Location check
      if (selectedLocation === 'has_location') {
        if (!s.location || s.location.trim() === '') return false;
      } else if (selectedLocation !== 'all') {
        if (!s.location || s.location.trim().toLowerCase() !== selectedLocation.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [shifts, startIso, endIso, selectedEmployeeId, selectedLocation]);

  // Aggregate Metrics
  const totalHours = useMemo(() => {
    return matchingShifts.reduce((sum, s) => {
      return sum + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);
    }, 0);
  }, [matchingShifts]);

  // Unique days with matching shifts
  const totalDays = useMemo(() => {
    const dates = new Set(matchingShifts.map((s) => s.date));
    return dates.size;
  }, [matchingShifts]);

  const totalShiftsCount = matchingShifts.length;
  const avgHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : '0.0';

  // Navigation handlers
  const handlePrevPeriod = () => {
    const next = new Date(anchorDate);
    if (timeframeType === 'weekly') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setAnchorDate(next);
  };

  const handleNextPeriod = () => {
    const next = new Date(anchorDate);
    if (timeframeType === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setAnchorDate(next);
  };

  const handleTodayPeriod = () => {
    setAnchorDate(new Date());
  };

  // Generate Quick Period Selector Options (past 6 and future 2 weeks/months)
  const quickPeriodOptions = useMemo(() => {
    const options: { label: string; date: Date }[] = [];
    const base = new Date();

    if (timeframeType === 'weekly') {
      const currentWeekSun = getStartOfWeek(base);
      for (let i = -8; i <= 4; i++) {
        const d = new Date(currentWeekSun);
        d.setDate(d.getDate() + i * 7);

        const wEnd = new Date(d);
        wEnd.setDate(wEnd.getDate() + 6);

        const label = `${formatDateISO(d)} to ${formatDateISO(wEnd)}${i === 0 ? ' (This Week)' : ''}`;
        options.push({ label, date: d });
      }
    } else {
      for (let i = -6; i <= 3; i++) {
        const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
        const label = `${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}${i === 0 ? ' (This Month)' : ''}`;
        options.push({ label, date: d });
      }
    }
    return options;
  }, [timeframeType]);

  // Breakdown by Location
  const locationBreakdown = useMemo(() => {
    const map = new Map<string, { days: Set<string>; hours: number; count: number }>();

    matchingShifts.forEach((s) => {
      const locKey = s.location && s.location.trim() !== '' ? s.location.trim() : 'No Location Specified';
      if (!map.has(locKey)) {
        map.set(locKey, { days: new Set(), hours: 0, count: 0 });
      }
      const item = map.get(locKey)!;
      item.days.add(s.date);
      item.hours += calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);
      item.count += 1;
    });

    return Array.from(map.entries()).map(([location, data]) => ({
      location,
      totalDays: data.days.size,
      totalHours: Number(data.hours.toFixed(1)),
      shiftCount: data.count,
    })).sort((a, b) => b.totalHours - a.totalHours);
  }, [matchingShifts]);

  // Breakdown by Employee
  const employeeBreakdown = useMemo(() => {
    const map = new Map<string, { days: Set<string>; hours: number; count: number; name: string }>();

    matchingShifts.forEach((s) => {
      const emp = employees.find((e) => e.id === s.employeeId);
      const name = emp ? emp.name : 'Unknown Member';
      const key = s.employeeId || name;

      if (!map.has(key)) {
        map.set(key, { days: new Set(), hours: 0, count: 0, name });
      }
      const item = map.get(key)!;
      item.days.add(s.date);
      item.hours += calculateShiftHours(s.startTime, s.endTime, s.breakMinutes);
      item.count += 1;
    });

    return Array.from(map.entries()).map(([empId, data]) => ({
      empId,
      name: data.name,
      totalDays: data.days.size,
      totalHours: Number(data.hours.toFixed(1)),
      shiftCount: data.count,
    })).sort((a, b) => b.totalHours - a.totalHours);
  }, [matchingShifts, employees]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Panel Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 shadow-inner">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Schedule Analytics & Work Hours</h2>
            <p className="text-xs text-slate-500 font-medium">
              Analyze work days, total hours, and locations for weekly or monthly schedules
            </p>
          </div>
        </div>

        {/* Selected Period Badge */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-3 space-x-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">{periodLabel}</span>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Analysis Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Team Member Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Team Member
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">👥 All Team Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  👤 {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Location Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Location Filter
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="has_location">📍 Shifts with Location Only</option>
              <option value="all">🌐 All Shifts (With or Without Location)</option>
              {availableLocations.length > 0 && (
                <optgroup label="Specific Locations">
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      📍 {loc}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 3. Timeframe Type Toggle (Weekly / Monthly) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Timeframe Mode
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTimeframeType('weekly')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframeType === 'weekly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimeframeType('monthly')}
                className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframeType === 'monthly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* 4. Period Selector Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Select {timeframeType === 'weekly' ? 'Week' : 'Month'}
            </label>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrevPeriod}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title={`Previous ${timeframeType === 'weekly' ? 'Week' : 'Month'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={
                  timeframeType === 'weekly'
                    ? formatDateISO(getStartOfWeek(anchorDate))
                    : `${anchorDate.getFullYear()}-${anchorDate.getMonth()}`
                }
                onChange={(e) => {
                  if (timeframeType === 'weekly') {
                    setAnchorDate(parseDateISO(e.target.value));
                  } else {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setAnchorDate(new Date(y, m, 1));
                  }
                }}
                className="flex-1 text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer truncate"
              >
                {quickPeriodOptions.map((opt, i) => {
                  const val =
                    timeframeType === 'weekly'
                      ? formatDateISO(opt.date)
                      : `${opt.date.getFullYear()}-${opt.date.getMonth()}`;
                  return (
                    <option key={i} value={val}>
                      {opt.label}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={handleNextPeriod}
                className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title={`Next ${timeframeType === 'weekly' ? 'Week' : 'Month'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTodayPeriod}
                className="px-2.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                title="Jump to Current Period"
              >
                Current
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md space-y-1">
          <div className="flex items-center justify-between opacity-80 text-xs font-medium">
            <span>Total Work Hours</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {totalHours.toFixed(1)} <span className="text-sm font-semibold opacity-90">hrs</span>
          </div>
          <p className="text-[11px] opacity-75 pt-1">
            Sum of scheduled shift hours in selected period
          </p>
        </div>

        {/* Total Work Days Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Work Days</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalDays} <span className="text-sm font-semibold text-slate-500">days</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Unique dates with location shifts
          </p>
        </div>

        {/* Total Shifts Count Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Shifts</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalShiftsCount} <span className="text-sm font-semibold text-slate-500">shifts</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Matching shift entries found
          </p>
        </div>

        {/* Avg Hours / Day Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg Hours / Work Day</span>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {avgHoursPerDay} <span className="text-sm font-semibold text-slate-500">hrs/day</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Total hours divided by total work days
          </p>
        </div>
      </div>

      {/* Breakdowns Grid (Location & Team Member) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Breakdown by Location</h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {locationBreakdown.length} location(s)
            </span>
          </div>

          {locationBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No shifts with location found in this timeframe.
            </p>
          ) : (
            <div className="space-y-3">
              {locationBreakdown.map((item, idx) => {
                const percent = totalHours > 0 ? Math.round((item.totalHours / totalHours) * 100) : 0;
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        {item.location}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-600 font-semibold">{item.totalDays} days</span>
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.totalHours} hrs
                        </span>
                      </div>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Member Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Breakdown by Team Member</h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {employeeBreakdown.length} member(s)
            </span>
          </div>

          {employeeBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No matching shifts found in this timeframe.
            </p>
          ) : (
            <div className="space-y-3">
              {employeeBreakdown.map((item, idx) => {
                const percent = totalHours > 0 ? Math.round((item.totalHours / totalHours) * 100) : 0;
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        {item.name}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-600 font-semibold">{item.totalDays} days</span>
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {item.totalHours} hrs
                        </span>
                      </div>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Matching Shifts Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Shift Schedule Details</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {matchingShifts.length} Shift Entries
          </span>
        </div>

        {matchingShifts.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No shifts match the selected filters.</p>
            <p className="text-xs text-slate-500">Try adjusting the team member, location, or week/month filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px] bg-slate-50/80">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Break</th>
                  <th className="py-3 px-4 text-right">Work Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matchingShifts.map((shift) => {
                  const emp = employees.find((e) => e.id === shift.employeeId);
                  const hrs = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes);
                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {shift.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {emp ? emp.name : 'Unknown Member'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {shift.location ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]">
                            <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
                            {shift.location}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Location</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {shift.startTime && shift.endTime ? `${shift.startTime} – ${shift.endTime}` : 'All Day / Flexible'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {shift.breakMinutes} min
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700 whitespace-nowrap">
                        {hrs.toFixed(1)} hrs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
