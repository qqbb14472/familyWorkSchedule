import React, { useState } from 'react';
import { Employee, TimeOffRequest, Shift } from '../types';
import { Coffee, User, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface TimeOffManagerProps {
  timeOffRequests: TimeOffRequest[];
  employees: Employee[];
  shifts?: Shift[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onSubmitRequest?: (request: Omit<TimeOffRequest, 'id' | 'status' | 'submittedAt'>) => void;
}

function getDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
}

export const TimeOffManager: React.FC<TimeOffManagerProps> = ({
  timeOffRequests,
  employees,
  shifts = [],
  onApprove,
  onReject,
}) => {
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  const toggleExpand = (empId: string) => {
    setExpandedEmpId((prev) => (prev === empId ? null : empId));
  };

  return (
    <div className="space-y-4">
      {/* Summary Table by Team Member */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Team Member</th>
                <th className="p-3.5 text-center">Total Time Off Days</th>
                <th className="p-3.5">Breakdown</th>
                <th className="p-3.5">Scheduled Dates</th>
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
                    (s) => (s.employeeId === emp.id || s.employeeName === emp.name) && (s.isTimeOff || s.isCompressedDay || s.status === 'time_off')
                  );
                  const empRequests = timeOffRequests.filter((r) => r.employeeId === emp.id);

                  const approvedReqs = empRequests.filter((r) => r.status === 'approved');
                  const pendingReqs = empRequests.filter((r) => r.status === 'pending');

                  // Counts
                  const compressDaysCount = empShifts.filter((s) => s.isCompressedDay).length;
                  const timeOffShiftsCount = empShifts.filter((s) => s.isTimeOff || (s.status === 'time_off' && !s.isCompressedDay)).length;
                  const approvedReqDaysCount = approvedReqs.reduce((sum, r) => sum + getDaysBetween(r.startDate, r.endDate), 0);

                  const totalTimeOffDays = compressDaysCount + timeOffShiftsCount + approvedReqDaysCount;

                  // Breakdown stats
                  const vacationDays = approvedReqs.filter((r) => r.type === 'vacation').reduce((sum, r) => sum + getDaysBetween(r.startDate, r.endDate), 0);
                  const sickDays = approvedReqs.filter((r) => r.type === 'sick').reduce((sum, r) => sum + getDaysBetween(r.startDate, r.endDate), 0);
                  const personalDays = approvedReqs.filter((r) => r.type === 'personal' || r.type === 'bereavement').reduce((sum, r) => sum + getDaysBetween(r.startDate, r.endDate), 0);

                  const isExpanded = expandedEmpId === emp.id;

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
                            </div>
                          </div>
                        </td>

                        {/* Total Time Off Days */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-200">
                            {totalTimeOffDays} {totalTimeOffDays === 1 ? 'Day' : 'Days'}
                          </span>
                        </td>

                        {/* Breakdown */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {vacationDays > 0 && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold">
                                Vacation: {vacationDays}d
                              </span>
                            )}
                            {sickDays > 0 && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200/60 font-semibold">
                                Sick: {sickDays}d
                              </span>
                            )}
                            {compressDaysCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold flex items-center gap-1">
                                <Coffee className="w-3 h-3 text-purple-600" />
                                Compress: {compressDaysCount}d
                              </span>
                            )}
                            {timeOffShiftsCount > 0 && (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-semibold">
                                Time Off: {timeOffShiftsCount}d
                              </span>
                            )}
                            {personalDays > 0 && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold">
                                Personal: {personalDays}d
                              </span>
                            )}
                            {totalTimeOffDays === 0 && (
                              <span className="text-slate-400 font-normal">No days logged</span>
                            )}
                          </div>
                        </td>

                        {/* Scheduled Dates */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {empShifts.slice(0, 3).map((s) => (
                              <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {s.date} {s.isCompressedDay ? '(Compress)' : '(Time Off)'}
                              </span>
                            ))}
                            {approvedReqs.slice(0, 2).map((r) => (
                              <span key={r.id} className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                                {r.startDate}{r.startDate !== r.endDate ? ` - ${r.endDate}` : ''} ({r.type})
                              </span>
                            ))}
                            {empShifts.length === 0 && approvedReqs.length === 0 && (
                              <span className="text-slate-400 font-normal">None scheduled</span>
                            )}
                          </div>
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
                            <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                  <User className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Time Off Records for {emp.name}</span>
                                </h4>
                              </div>

                              {empRequests.length === 0 && empShifts.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No time off requests or compress days recorded for this team member.</p>
                              ) : (
                                <div className="space-y-2">
                                  {empRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-md border border-slate-200 text-xs">
                                      <div className="space-y-0.5">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-bold text-slate-900 capitalize">{req.type}</span>
                                          <span className="text-[10px] text-slate-500">
                                            {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                                          </span>
                                        </div>
                                        {req.reason && <p className="text-[11px] text-slate-600 font-normal">Reason: {req.reason}</p>}
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                          req.status === 'approved'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : req.status === 'rejected'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {req.status}
                                        </span>

                                        {req.status === 'pending' && (
                                          <div className="flex items-center space-x-1.5 ml-2">
                                            <button
                                              onClick={() => onApprove(req.id)}
                                              className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => onReject(req.id)}
                                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {empShifts.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between bg-purple-50/60 p-2.5 rounded-md border border-purple-200 text-xs">
                                      <div className="flex items-center space-x-2">
                                        <Coffee className="w-3.5 h-3.5 text-purple-700" />
                                        <span className="font-bold text-purple-900">{s.isCompressedDay ? 'Compress Day' : 'Time Off Shift'}</span>
                                        <span className="text-[10px] text-purple-700 font-semibold">Date: {s.date}</span>
                                      </div>
                                      <span className="text-[10px] font-extrabold bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                                        Scheduled
                                      </span>
                                    </div>
                                  ))}
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
