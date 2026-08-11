import React, { useState, useEffect } from 'react';
import { ViewMode, Employee, Shift, TimeOffRequest, ShiftSwapRequest } from './types';
import {
  INITIAL_EMPLOYEES,
  SHIFT_PRESETS,
  generateInitialShifts,
  generateInitialTimeOffRequests,
  generateInitialShiftSwaps,
} from './data/initialData';
import { getStartOfWeek, getWeekDays, formatDateISO } from './utils/dateUtils';
import { Header } from './components/Header';
import { ScheduleGrid } from './components/ScheduleGrid';
import { MonthView } from './components/MonthView';
import { ShiftModal } from './components/ShiftModal';
import { TimeOffManager } from './components/TimeOffManager';
import { MemberScheduleModal } from './components/MemberScheduleModal';
import { DeleteRangeModal } from './components/DeleteRangeModal';
import { LoginScreen } from './components/LoginScreen';
import { Snackbar, ToastMessage } from './components/Snackbar';
import { isAuthenticated, setAuthenticated, getStoredAccount } from './utils/authUtils';

import {
  fetchCollectionFromCloud,
  saveDocToCloud,
  deleteDocFromCloud,
  syncCollectionToCloud,
  setCloudErrorHandler,
} from './utils/firebase';

export default function App() {
  // Toast Snackbar State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Register Cloud Error Listener
  useEffect(() => {
    setCloudErrorHandler((errorMsg) => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'error',
        message: errorMsg,
      };
      setToasts((prev) => [...prev, newToast]);
    });
    return () => {
      setCloudErrorHandler(null);
    };
  }, []);

  // Authentication state
  const [isAuthed, setIsAuthed] = useState<boolean>(() => isAuthenticated());

  // Initialize account credential storage on mount
  useEffect(() => {
    getStoredAccount();
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
    setIsAuthed(false);
  };

  // Navigation & Filter state
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('wsm_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('wsm_shifts');
    return saved ? JSON.parse(saved) : generateInitialShifts();
  });

  // Load from Cloud Database on mount
  useEffect(() => {
    async function loadCloudData() {
      const cloudEmployees = await fetchCollectionFromCloud<Employee>('employees');
      if (cloudEmployees && cloudEmployees.length > 0) {
        setEmployees(cloudEmployees);
      } else {
        // First initialization to cloud
        syncCollectionToCloud('employees', employees);
      }

      const cloudShifts = await fetchCollectionFromCloud<Shift>('shifts');
      if (cloudShifts && cloudShifts.length > 0) {
        setShifts(cloudShifts);
      } else {
        syncCollectionToCloud('shifts', shifts);
      }

      const cloudTimeOff = await fetchCollectionFromCloud<TimeOffRequest>('timeoff');
      if (cloudTimeOff && cloudTimeOff.length > 0) {
        setTimeOffRequests(cloudTimeOff);
      } else {
        syncCollectionToCloud('timeoff', timeOffRequests);
      }

      const cloudSwaps = await fetchCollectionFromCloud<ShiftSwapRequest>('swaps');
      if (cloudSwaps && cloudSwaps.length > 0) {
        setShiftSwaps(cloudSwaps);
      } else {
        syncCollectionToCloud('swaps', shiftSwaps);
      }
    }

    loadCloudData();
  }, []);


  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>(() => {
    const saved = localStorage.getItem('wsm_timeoff');
    return saved ? JSON.parse(saved) : generateInitialTimeOffRequests();
  });

  const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>(() => {
    const saved = localStorage.getItem('wsm_swaps');
    return saved ? JSON.parse(saved) : generateInitialShiftSwaps();
  });

  // Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isDeleteRangeModalOpen, setIsDeleteRangeModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [modalInitialEmpId, setModalInitialEmpId] = useState<string | undefined>();
  const [modalInitialDateStr, setModalInitialDateStr] = useState<string | undefined>();
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);

  // Open Shift Modal to add shift for member
  const handleAddShiftForMember = (employeeId: string) => {
    setEditingShift(null);
    setModalInitialEmpId(employeeId);
    setModalInitialDateStr(formatDateISO(new Date()));
    setIsShiftModalOpen(true);
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('wsm_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('wsm_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('wsm_timeoff', JSON.stringify(timeOffRequests));
  }, [timeOffRequests]);

  useEffect(() => {
    localStorage.setItem('wsm_swaps', JSON.stringify(shiftSwaps));
  }, [shiftSwaps]);

  // Open Shift Modal for empty grid cell
  const handleCellClick = (employeeId: string, dateStr: string) => {
    setEditingShift(null);
    setModalInitialEmpId(employeeId);
    setModalInitialDateStr(dateStr);
    setIsShiftModalOpen(true);
  };

  // Open Shift Modal for editing
  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setModalInitialEmpId(shift.employeeId);
    setModalInitialDateStr(shift.date);
    setIsShiftModalOpen(true);
  };

  // Save Shift handler
  const handleSaveShift = (
    shiftData: Omit<Shift, 'id' | 'employeeId'> & {
      id?: string;
      employeeId?: string;
      employeeName?: string;
      recurringDates?: string[];
    }
  ) => {
    let finalEmpId = shiftData.employeeId;

    if (shiftData.employeeName && shiftData.employeeName.trim()) {
      const nameTrimmed = shiftData.employeeName.trim();
      const existingEmpByName = employees.find(
        (e) => e.name.toLowerCase() === nameTrimmed.toLowerCase()
      );

      if (existingEmpByName) {
        finalEmpId = existingEmpByName.id;
      } else if (finalEmpId && employees.some((e) => e.id === finalEmpId)) {
        // Update existing employee's name
        const targetEmp = employees.find((e) => e.id === finalEmpId)!;
        const updatedEmp = { ...targetEmp, name: nameTrimmed };
        setEmployees((prev) => prev.map((e) => (e.id === finalEmpId ? updatedEmp : e)));
        saveDocToCloud('employees', updatedEmp);
      } else {
        // Create a new team member automatically with this name
        const newEmp: Employee = {
          id: `emp-${Date.now()}`,
          name: nameTrimmed,
          phone: '',
          avatarBg: 'bg-indigo-500',
        };
        setEmployees((prev) => [...prev, newEmp]);
        saveDocToCloud('employees', newEmp);
        finalEmpId = newEmp.id;
      }
    }

    if (!finalEmpId) return;

    if (shiftData.id) {
      const shiftToSave: Shift = {
        id: shiftData.id,
        employeeId: finalEmpId,
        date: shiftData.date,
        startTime: shiftData.startTime,
        endTime: shiftData.endTime,
        breakMinutes: shiftData.breakMinutes,
        location: shiftData.location,
        notes: shiftData.notes,
        description: shiftData.description,
        status: (shiftData.isCompressedDay || shiftData.isTimeOff) ? 'time_off' : (shiftData.status || 'scheduled'),
        colorPreset: shiftData.colorPreset,
        isCompressedDay: shiftData.isCompressedDay,
        isTimeOff: shiftData.isTimeOff,
      };
      setShifts((prev) =>
        prev.map((s) => (s.id === shiftData.id ? shiftToSave : s))
      );
      saveDocToCloud('shifts', shiftToSave);

      const successToast: ToastMessage = {
        id: `toast-${Date.now()}`,
        type: 'success',
        message: 'Shift schedule updated successfully in database.',
      };
      setToasts((prev) => [...prev, successToast]);
    } else {
      const datesToSchedule =
        shiftData.recurringDates && shiftData.recurringDates.length > 0
          ? shiftData.recurringDates
          : [shiftData.date];

      const newShifts: Shift[] = datesToSchedule.map((d, index) => ({
        id: `shift-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId: finalEmpId!,
        date: d,
        startTime: shiftData.startTime,
        endTime: shiftData.endTime,
        breakMinutes: shiftData.breakMinutes,
        location: shiftData.location,
        notes: shiftData.notes,
        description: shiftData.description,
        status: (shiftData.isCompressedDay || shiftData.isTimeOff) ? 'time_off' : (shiftData.status || 'scheduled'),
        colorPreset: shiftData.colorPreset,
        isCompressedDay: shiftData.isCompressedDay,
        isTimeOff: shiftData.isTimeOff,
      }));

      setShifts((prev) => [...prev, ...newShifts]);
      newShifts.forEach((ns) => saveDocToCloud('shifts', ns));
    }
  };

  // Delete Shift handler
  const handleDeleteShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    deleteDocFromCloud('shifts', shiftId);
  };

  // Delete Shifts by Date Range handler
  const handleDeleteShiftsByRange = (startDate: string, endDate: string, employeeId?: string) => {
    const shiftsToDelete = shifts.filter((s) => {
      const inRange = s.date >= startDate && s.date <= endDate;
      const matchesEmp = !employeeId || s.employeeId === employeeId;
      return inRange && matchesEmp;
    });

    if (shiftsToDelete.length === 0) return;

    // Delete matching shifts from Firestore database
    shiftsToDelete.forEach((s) => {
      deleteDocFromCloud('shifts', s.id);
    });

    // Remove matching shifts from local state
    const deleteIds = new Set(shiftsToDelete.map((s) => s.id));
    setShifts((prev) => prev.filter((s) => !deleteIds.has(s.id)));

    // Trigger success toast
    const successToast: ToastMessage = {
      id: `toast-${Date.now()}`,
      type: 'success',
      message: `Successfully deleted ${shiftsToDelete.length} shift(s) between ${startDate} and ${endDate} from database.`,
    };
    setToasts((prev) => [...prev, successToast]);
  };

  // Copy Previous Week Schedule
  const handleCopyPreviousWeek = () => {
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekDays = getWeekDays(prevWeekStart).map(formatDateISO);

    const currentWeekDays = getWeekDays(currentWeekStart).map(formatDateISO);

    const prevShifts = shifts.filter(
      (s) => prevWeekDays.includes(s.date) && s.status !== 'canceled'
    );

    if (prevShifts.length === 0) {
      return;
    }

    const copiedShifts: Shift[] = prevShifts.map((s, idx) => {
      const dayIndex = prevWeekDays.indexOf(s.date);
      const newDate = currentWeekDays[dayIndex >= 0 ? dayIndex : 0];
      return {
        ...s,
        id: `shift-copy-${Date.now()}-${idx}`,
        date: newDate,
      };
    });

    setShifts((prev) => [...prev, ...copiedShifts]);
    copiedShifts.forEach((cs) => saveDocToCloud('shifts', cs));
  };

  const handleOpenNewShiftForDate = (dateStr: string) => {
    setEditingShift(null);
    setModalInitialEmpId(undefined);
    setModalInitialDateStr(dateStr);
    setIsShiftModalOpen(true);
  };

  // Export Active Schedule to CSV
  const handleExportCSV = () => {
    const currentWeekDays = getWeekDays(currentWeekStart).map(formatDateISO);
    const activeShifts = shifts.filter((s) => currentWeekDays.includes(s.date) && s.status !== 'canceled');

    if (activeShifts.length === 0) {
      alert('No active shifts to export for this week.');
      return;
    }

    const headers = ['Employee Name', 'Date', 'Start Time', 'End Time', 'Break (Mins)', 'Notes'];
    const rows = activeShifts.map((s) => {
      const emp = employees.find((e) => e.id === s.employeeId);
      return [
        `"${emp?.name || ''}"`,
        `"${s.date}"`,
        `"${s.startTime}"`,
        `"${s.endTime}"`,
        s.breakMinutes,
        `"${s.notes || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `workSchedule_${currentWeekDays[0]}_to_${currentWeekDays[6]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Employee CRUD handlers
  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    saveDocToCloud('employees', updatedEmp);
    setSelectedMember(updatedEmp);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    deleteDocFromCloud('employees', employeeId);
    
    // Delete associated shifts from state and cloud
    shifts.filter((s) => s.employeeId === employeeId).forEach((s) => deleteDocFromCloud('shifts', s.id));
    setShifts((prev) => prev.filter((s) => s.employeeId !== employeeId));

    setTimeOffRequests((prev) => prev.filter((r) => r.employeeId !== employeeId));
    setShiftSwaps((prev) =>
      prev.filter((s) => s.requesterId !== employeeId && s.targetEmployeeId !== employeeId)
    );
    if (selectedMember?.id === employeeId) {
      setSelectedMember(null);
    }
  };

  // Time Off Request Handlers
  const handleApproveTimeOff = (id: string) => {
    setTimeOffRequests((prev) => {
      const updated = prev.map((req) => (req.id === id ? { ...req, status: 'approved' as const } : req));
      const target = updated.find((r) => r.id === id);
      if (target) saveDocToCloud('timeoff', target);
      return updated;
    });
  };

  const handleRejectTimeOff = (id: string) => {
    setTimeOffRequests((prev) => {
      const updated = prev.map((req) => (req.id === id ? { ...req, status: 'rejected' as const } : req));
      const target = updated.find((r) => r.id === id);
      if (target) saveDocToCloud('timeoff', target);
      return updated;
    });
  };

  const handleSubmitTimeOff = (
    request: Omit<TimeOffRequest, 'id' | 'status' | 'submittedAt'>
  ) => {
    const newReq: TimeOffRequest = {
      ...request,
      id: `timeoff-${Date.now()}`,
      status: 'pending',
      submittedAt: formatDateISO(new Date()),
    };
    setTimeOffRequests((prev) => [newReq, ...prev]);
    saveDocToCloud('timeoff', newReq);
  };

  const pendingRequestsCount = timeOffRequests.filter((r) => r.status === 'pending').length;

  if (!isAuthed) {
    return <LoginScreen onLoginSuccess={() => setIsAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* App Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentWeekStart={currentWeekStart}
        setCurrentWeekStart={setCurrentWeekStart}
        onOpenNewShiftModal={() => {
          setEditingShift(null);
          setModalInitialEmpId(undefined);
          setModalInitialDateStr(undefined);
          setIsShiftModalOpen(true);
        }}
        onCopyPreviousWeek={handleCopyPreviousWeek}
        onOpenDeleteRangeModal={() => setIsDeleteRangeModalOpen(true)}
        onExportSchedule={handleExportCSV}
        pendingRequestsCount={pendingRequestsCount}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'week' && (
          <ScheduleGrid
            employees={employees}
            shifts={shifts}
            timeOffRequests={timeOffRequests}
            shiftPresets={SHIFT_PRESETS}
            currentWeekStart={currentWeekStart}
            onCellClick={handleCellClick}
            onEditShift={handleEditShift}
            onDeleteShift={handleDeleteShift}
            onSelectEmployee={(emp) => setSelectedMember(emp)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {viewMode === 'month' && (
          <MonthView
            shifts={shifts}
            employees={employees}
            currentDate={currentWeekStart}
            setCurrentDate={setCurrentWeekStart}
            onOpenNewShiftModal={() => setIsShiftModalOpen(true)}
            onOpenNewShiftModalForDate={handleOpenNewShiftForDate}
            onEditShift={handleEditShift}
          />
        )}

        {viewMode === 'timeoff' && (
          <TimeOffManager
            timeOffRequests={timeOffRequests}
            employees={employees}
            shifts={shifts}
            onApprove={handleApproveTimeOff}
            onReject={handleRejectTimeOff}
            onSubmitRequest={handleSubmitTimeOff}
          />
        )}
      </main>

      {/* Shift Creation & Editing Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        editingShift={editingShift}
        employees={employees}
        shiftPresets={SHIFT_PRESETS}
        allShifts={shifts}
        timeOffRequests={timeOffRequests}
        initialEmployeeId={modalInitialEmpId}
        initialDateStr={modalInitialDateStr}
      />

      {/* Member Profile & Schedule Details Modal */}
      <MemberScheduleModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        employee={selectedMember}
        shifts={shifts}
        onUpdateEmployee={handleUpdateEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onAddShift={handleAddShiftForMember}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
      />

      {/* Delete Schedule Range Modal */}
      <DeleteRangeModal
        isOpen={isDeleteRangeModalOpen}
        onClose={() => setIsDeleteRangeModalOpen(false)}
        onDeleteRange={handleDeleteShiftsByRange}
        employees={employees}
        shifts={shifts}
        currentWeekStart={currentWeekStart}
      />

      {/* Global Snackbar Notifications */}
      <Snackbar toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
