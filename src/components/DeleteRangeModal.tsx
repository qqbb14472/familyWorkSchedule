import React, { useState, useEffect } from 'react';
import { Employee, Shift } from '../types';
import { X, Trash2, Calendar, User, AlertTriangle } from 'lucide-react';
import { formatDateISO } from '../utils/dateUtils';

interface DeleteRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteRange: (startDate: string, endDate: string, employeeId?: string) => void;
  employees: Employee[];
  shifts: Shift[];
  currentWeekStart: Date;
}

export const DeleteRangeModal: React.FC<DeleteRangeModalProps> = ({
  isOpen,
  onClose,
  onDeleteRange,
  employees,
  shifts,
  currentWeekStart,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      const startStr = formatDateISO(currentWeekStart);
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 6);
      const endStr = formatDateISO(end);

      setStartDate(startStr);
      setEndDate(endStr);
      setSelectedEmployeeId('all');
    }
  }, [isOpen, currentWeekStart]);

  if (!isOpen) return null;

  // Calculate matching shifts count for live preview
  const matchingShifts = shifts.filter((s) => {
    if (!startDate || !endDate) return false;
    const inRange = s.date >= startDate && s.date <= endDate;
    const matchesEmp = selectedEmployeeId === 'all' || s.employeeId === selectedEmployeeId;
    return inRange && matchesEmp;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    if (startDate > endDate) {
      alert('Start date cannot be after end date.');
      return;
    }

    const count = matchingShifts.length;
    if (count === 0) {
      alert('No shifts found in the selected date range.');
      return;
    }

    const empName = selectedEmployeeId === 'all' 
      ? 'all team members' 
      : employees.find(e => e.id === selectedEmployeeId)?.name || 'selected member';

    if (
      window.confirm(
        `Are you sure you want to permanently delete ${count} shift(s) for ${empName} between ${startDate} and ${endDate}?\n\nThis will remove them from the database.`
      )
    ) {
      onDeleteRange(startDate, endDate, selectedEmployeeId === 'all' ? undefined : selectedEmployeeId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Schedule Range</h3>
              <p className="text-xs text-slate-500">Remove shifts between selected dates from database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Start & End Date Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Team Member Filter
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Team Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delete Warning & Matching Summary */}
          <div className={`p-3.5 rounded-xl border ${matchingShifts.length > 0 ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${matchingShifts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              <div className="text-xs space-y-1">
                <p className="font-semibold">
                  {matchingShifts.length > 0
                    ? `Found ${matchingShifts.length} shift(s) to delete.`
                    : 'No shifts found in selected date range.'}
                </p>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Deleting will permanently remove these schedule records from both the app and Firestore database.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={matchingShifts.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete {matchingShifts.length > 0 ? `(${matchingShifts.length})` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
