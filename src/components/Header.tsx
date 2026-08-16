import React, { useState } from 'react';
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
  Settings,
  X,
  ChevronRight as ChevronRightIcon,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Date navigation handlers based on current view mode
  const handlePrev = () => {
    if (viewMode === 'month') {
      const prev = new Date(currentWeekStart);
      prev.setMonth(prev.getMonth() - 1);
      setCurrentWeekStart(prev);
    } else {
      const prev = new Date(currentWeekStart);
      prev.setDate(prev.getDate() - 7);
      setCurrentWeekStart(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const next = new Date(currentWeekStart);
      next.setMonth(next.getMonth() + 1);
      setCurrentWeekStart(next);
    } else {
      const next = new Date(currentWeekStart);
      next.setDate(next.getDate() + 7);
      setCurrentWeekStart(next);
    }
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
        <div className="flex items-center justify-between py-3 md:py-3.5 gap-4">
          {/* Brand & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Work Schedule</h1>
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  Pro
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">Family Member Schedule Management</p>
            </div>
          </div>

          {/* Desktop Action Buttons (Visible on md and above) */}
          <div className="hidden md:flex items-center flex-wrap gap-2">
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

          {/* Mobile Right Controls: Settings / Actions Button (Visible on mobile) */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={onOpenNewShiftModal}
              id="mobile-quick-add-btn"
              className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
              title="Add Shift"
              aria-label="Add Shift"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              id="mobile-settings-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              aria-label="Settings and Actions Menu"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Navigation Control Bar */}
        <div className="flex flex-row items-center justify-between border-t border-slate-100 py-2 sm:py-2.5 gap-2 sm:gap-3">
          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
            <div className="relative group">
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center justify-center p-2 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-lg md:rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'week'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Weekly"
                aria-label="Weekly Grid View"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline md:ml-1.5">Weekly</span>
              </button>
              {/* Tooltip on hover for mobile/icon view */}
              <div className="md:hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-md z-40 whitespace-nowrap">
                Weekly
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center justify-center p-2 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-lg md:rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'month'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Month"
                aria-label="Month View"
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline md:ml-1.5">Month</span>
              </button>
              {/* Tooltip on hover for mobile/icon view */}
              <div className="md:hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-md z-40 whitespace-nowrap">
                Month
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={() => setViewMode('timeoff')}
                className={`flex items-center justify-center p-2 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-lg md:rounded-md transition-colors cursor-pointer whitespace-nowrap relative ${
                  viewMode === 'timeoff'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Time Off"
                aria-label="Time Off Management"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline md:ml-1.5">Time Off</span>
                {pendingRequestsCount > 0 && (
                  <span className="ml-1 md:ml-1.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
              {/* Tooltip on hover for mobile/icon view */}
              <div className="md:hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-md z-40 whitespace-nowrap">
                Time Off
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={() => setViewMode('analysis')}
                className={`flex items-center justify-center p-2 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-lg md:rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'analysis'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Analysis"
                aria-label="Hours Analysis"
              >
                <BarChart2 className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline md:ml-1.5">Analysis</span>
              </button>
              {/* Tooltip on hover for mobile/icon view */}
              <div className="md:hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-md z-40 whitespace-nowrap">
                Analysis
              </div>
            </div>
          </nav>

          {/* Date Selector */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3 overflow-x-auto">
            {(viewMode === 'week' || viewMode === 'month') && (
              <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={handlePrev}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                  title={viewMode === 'month' ? 'Previous Month' : 'Previous Week'}
                  aria-label={viewMode === 'month' ? 'Previous Month' : 'Previous Week'}
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
                  onClick={handleNext}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                  title={viewMode === 'month' ? 'Next Month' : 'Next Week'}
                  aria-label={viewMode === 'month' ? 'Next Month' : 'Next Week'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Actions & Settings Bottom Drawer / Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          {/* Backdrop Click */}
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal Content */}
          <div className="relative z-10 w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Schedule Actions & Settings</h3>
                  <p className="text-xs text-slate-500">Quick management tools</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                id="close-mobile-menu-btn"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Items List */}
            <div className="space-y-2 pt-1">
              {/* Add Shift */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenNewShiftModal();
                }}
                id="mobile-action-add-shift"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-indigo-950">Add New Shift</div>
                    <div className="text-xs text-indigo-700/80">Create a work shift for a member</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-indigo-400" />
              </button>

              {/* Copy Prev Week */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onCopyPreviousWeek();
                }}
                id="mobile-action-copy-prev"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Copy className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Copy Previous Week</div>
                    <div className="text-xs text-slate-500">Duplicate last week's shifts into current week</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-slate-400" />
              </button>

              {/* Delete Range */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenDeleteRangeModal();
                }}
                id="mobile-action-delete-range"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/50 hover:bg-rose-100/80 border border-rose-200 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-rose-900">Delete Range</div>
                    <div className="text-xs text-rose-700/80">Batch delete shifts by custom date range</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-rose-400" />
              </button>

              {/* Export CSV */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onExportSchedule();
                }}
                id="mobile-action-export"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Export Schedule (CSV)</div>
                    <div className="text-xs text-slate-500">Download complete schedule data</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-slate-400" />
              </button>

              {/* Lock Application */}
              {onLogout && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  id="mobile-action-lock"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Lock Application</div>
                      <div className="text-xs text-slate-500">Sign out and require passcode / PIN</div>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
