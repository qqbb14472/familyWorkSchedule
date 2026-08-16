import React, { useState } from 'react';
import { Employee, Shift } from '../types';
import { calculateShiftHours, formatTime24h, parseDateISO } from '../utils/dateUtils';
import {
  X,
  User,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  ChevronRight,
  Palmtree,
  Coffee
} from 'lucide-react';

interface MemberScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  shifts: Shift[];
  onUpdateEmployee: (updated: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onAddShift: (employeeId: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const MemberScheduleModal: React.FC<MemberScheduleModalProps> = ({
  isOpen,
  onClose,
  employee,
  shifts,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddShift,
  onEditShift,
  onDeleteShift,
}) => {
  if (!isOpen || !employee) return null;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(employee.name);
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);

  // Filter shifts specifically for this employee and sort chronologically
  const memberShifts = shifts
    .filter((s) => s.employeeId === employee.id && s.status !== 'canceled')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalMemberHours = memberShifts.reduce(
    (acc, s) => acc + calculateShiftHours(s.startTime, s.endTime, s.breakMinutes),
    0
  );

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    onUpdateEmployee({
      ...employee,
      name: nameInput.trim(),
    });
    setIsEditingName(false);
  };

  const handleDeleteMember = () => {
    onDeleteEmployee(employee.id);
    setConfirmDeleteEmp(false);
    onClose();
  };

  const handleDeleteShiftConfirm = (shiftId: string) => {
    onDeleteShift(shiftId);
    setDeletingShiftId(null);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const dateObj = parseDateISO(dateStr);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-full ${employee.avatarBg || 'bg-indigo-600'} text-white flex items-center justify-center text-base font-bold shadow-md border-2 border-white/20 shrink-0`}
            >
              {employee.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-white/10 text-white border border-white/30 rounded-lg px-2.5 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                    title="Save Name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setNameInput(employee.name);
                      setIsEditingName(false);
                    }}
                    className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold tracking-tight">{employee.name}</h3>
                  <button
                    onClick={() => {
                      setNameInput(employee.name);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-indigo-200 mt-0.5 flex items-center">
                <User className="w-3 h-3 mr-1" /> Team Member Profile & Schedule
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Stats & Member Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
                Total Shifts
              </span>
              <span className="text-xl font-extrabold text-indigo-950">
                {memberShifts.length}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                Total Hours
              </span>
              <span className="text-xl font-extrabold text-slate-900">
                {totalMemberHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Member Actions
                </span>
                {!confirmDeleteEmp ? (
                  <button
                    onClick={() => setConfirmDeleteEmp(true)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center cursor-pointer mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete Member
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      onClick={handleDeleteMember}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteEmp(false)}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Details Header */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center">
                <Calendar className="w-4 h-4 text-indigo-600 mr-2" />
                Shift Schedule ({memberShifts.length})
              </h4>
              <p className="text-xs text-slate-500">
                View, update, add or remove scheduled work shifts for {employee.name}.
              </p>
            </div>

            <button
              onClick={() => {
                onAddShift(employee.id);
              }}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Shift
            </button>
          </div>

          {/* Shift Schedule List */}
          {memberShifts.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No shifts scheduled</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "Add Shift" above to assign a work schedule to {employee.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {memberShifts.map((shift) => {
                const isCompressed = shift.isCompressedDay;
                const isHoliday = shift.isHoliday || shift.status === 'holiday';
                const isTimeOff = !isHoliday && (shift.isTimeOff || (shift.status === 'time_off' && !shift.isCompressedDay));
                const hours = isCompressed ? 0 : calculateShiftHours(
                  shift.startTime,
                  shift.endTime,
                  shift.breakMinutes
                );
                const isDeleting = deletingShiftId === shift.id;

                return (
                  <div
                    key={shift.id}
                    className={`p-3.5 border rounded-xl hover:border-slate-300 transition-all shadow-2xs flex items-center justify-between gap-3 group ${
                      isHoliday 
                        ? 'bg-orange-50/70 border-orange-200/90' 
                        : isCompressed || isTimeOff 
                        ? 'bg-purple-50/70 border-purple-200/90' 
                        : 'bg-white border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isHoliday 
                          ? 'bg-orange-100 text-orange-800' 
                          : isCompressed || isTimeOff 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {isHoliday ? (
                          <Palmtree className="w-4 h-4" />
                        ) : isCompressed || isTimeOff ? (
                          <Coffee className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-bold text-slate-900">
                            {formatDisplayDate(shift.date)}
                          </span>
                          {isHoliday ? (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-orange-200 text-orange-950 rounded">
                              Holiday (Off) • {hours} hrs
                            </span>
                          ) : isCompressed ? (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded">
                              Compress Day
                            </span>
                          ) : isTimeOff ? (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded">
                              Time Off • {hours} hrs
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {hours} hrs
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                          {isCompressed ? (
                            <span className="text-purple-700 font-semibold">Off Day</span>
                          ) : shift.startTime && shift.endTime ? (
                            <>
                              {formatTime24h(shift.startTime)} – {formatTime24h(shift.endTime)}{' '}
                              {shift.breakMinutes > 0 && (
                                <span className="text-slate-400 text-[11px]">
                                  ({shift.breakMinutes}m break)
                                </span>
                              )}
                            </>
                          ) : (
                            <span>Time Off</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {!isDeleting ? (
                        <>
                          <button
                            onClick={() => onEditShift(shift)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Shift"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingShiftId(shift.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Shift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-bold text-rose-800">Delete?</span>
                          <button
                            onClick={() => handleDeleteShiftConfirm(shift.id)}
                            className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer hover:bg-rose-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingShiftId(null)}
                            className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer hover:bg-slate-300"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
