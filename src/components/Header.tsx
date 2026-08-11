import React from 'react';
import { ViewMode } from '../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Download,
  CalendarDays,
  LayoutGrid,
  LogOut,
  Trash2,
  BarChart2,
} from 'lucide-react';
import { getStartOfWeek } from '../utils/dateUtils';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentWeekStart: Date;
  setCurrentWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  onOpenNewShiftModal: () => void;
  onCopyPreviousWeek: () => void;
  onOpenDeleteRangeModal: () => void;
  onExportSchedule: () => void;
  pendingRequestsCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  currentWeekStart,
  setCurrentWeekStart,
  onOpenNewShiftModal,
  onCopyPreviousWeek,
  onOpenDeleteRangeModal,
  onExportSchedule,
  pendingRequestsCount,
  onLogout,
}) => {
  // Date navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(currentWeekStart);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentWeekStart(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentWeekStart);
    next.setMonth(next.getMonth() + 1);
    setCurrentWeekStart(next);
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  // Format week range string e.g., "Aug 3 - Aug 9, 2026"
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonthStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endMonthStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateRangeTitle = `${startMonthStr} – ${endMonthStr}`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">
          {/* Brand & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Work Schedule</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Family Member Schedule Management</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenNewShiftModal}
              id="add-shift-btn"
              className="inline-flex items-center px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Shift
            </button>

            <button
              onClick={onCopyPreviousWeek}
              title="Duplicate schedule from last week"
              className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-1.5 text-slate-500" />
              Copy Prev Week
            </button>

            <button
              onClick={onOpenDeleteRangeModal}
              title="Delete schedule by date range"
              className="inline-flex items-center px-3 py-2 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 text-sm font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1.5 text-rose-600" />
              Delete Range
            </button>

            <button
              onClick={onExportSchedule}
              title="Export active schedule to CSV"
              className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-500" />
              Export
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Lock Application / Sign Out"
                className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-sm font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-1.5 text-slate-500" />
                Lock
              </button>
            )}
          </div>
        </div>

        {/* View Mode Tabs & Navigation Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 py-2.5 gap-3">
          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Weekly Grid
            </button>

            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'month'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="w-4 h-4 mr-1.5" />
              Month
            </button>

            <button
              onClick={() => setViewMode('timeoff')}
              className={`flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap relative ${
                viewMode === 'timeoff'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Time Off
              {pendingRequestsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('analysis')}
              className={`flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'analysis'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-4 h-4 mr-1.5" />
              Analysis
            </button>
          </nav>

          {/* Date Selector */}
          <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {(viewMode === 'week' || viewMode === 'month') && (
              <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  className="px-2 py-0.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  ‹ Month
                </button>
                <button
                  onClick={handlePrevWeek}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-0.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer border border-indigo-200/60"
                  title="Jump to Today"
                >
                  Today
                </button>
                <span className="text-xs font-bold text-slate-800 px-2 whitespace-nowrap min-w-[110px] text-center">
                  {viewMode === 'month'
                    ? currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : dateRangeTitle}
                </span>
                <button
                  onClick={handleNextWeek}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="px-2 py-0.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                  title="Next Month"
                >
                  Month ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
