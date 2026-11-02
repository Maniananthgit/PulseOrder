import React, { useState, useEffect } from 'react';
import { 
  ScanFace, 
  Fingerprint, 
  QrCode, 
  UserCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus, 
  Calendar, 
  Building2, 
  Coffee, 
  LogOut, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Eye
} from 'lucide-react';
import { 
  attendanceService, 
  AttendanceRecord, 
  Employee, 
  StaffDepartment, 
  AttendanceStatus, 
  VerificationMethod 
} from '../../../services/attendanceService';
import { AttendancePunchModal } from '../AttendancePunchModal';
import { useKiosk } from '../../../context/KioskContext';

interface AttendancePageProps {
  selectedBranch?: string;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ 
  selectedBranch = 'Indiranagar Flagship' 
}) => {
  const { showToast } = useKiosk();
  const todayDate = new Date().toISOString().split('T')[0];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [selectedEmployeeForPunch, setSelectedEmployeeForPunch] = useState<string | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data
  const loadData = () => {
    const emps = attendanceService.getEmployees();
    setEmployees(emps);
    const recs = attendanceService.getAttendanceRecords(selectedDate);
    setRecords(recs);
  };

  useEffect(() => {
    loadData();

    // Reconcile with Cloud Database on mount
    attendanceService.syncWithCloud().then(() => {
      loadData();
    });

    // Listen to real-time attendance changes from other kiosk/tabs
    const unsubscribe = attendanceService.onAttendanceChange(() => {
      loadData();
    });

    return () => unsubscribe();
  }, [selectedDate]);

  // Handle Manual Cloud Sync
  const handleCloudSync = async () => {
    setIsSyncing(true);
    await attendanceService.syncWithCloud();
    loadData();
    setIsSyncing(false);
    showToast('☁️ Cloud PostgreSQL Database Synced successfully!');
  };

  // Metrics
  const metrics = attendanceService.getTodayMetrics(selectedDate);

  // Filtered records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch = 
      rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'All' || rec.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PRESENT
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            LATE
          </span>
        );
      case 'ON_BREAK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Coffee className="w-3 h-3 text-blue-400" />
            ON BREAK
          </span>
        );
      case 'CLOCKED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-700/50 text-slate-300 border border-white/10">
            <LogOut className="w-3 h-3 text-slate-400" />
            CLOCKED OUT
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            ABSENT
          </span>
        );
    }
  };

  const getMethodBadge = (method: VerificationMethod) => {
    switch (method) {
      case 'FACE_SCAN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            <ScanFace className="w-3 h-3" />
            Face Scan
          </span>
        );
      case 'BIOMETRIC_THUMB':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md border border-indigo-400/20">
            <Fingerprint className="w-3 h-3" />
            Thumb Print
          </span>
        );
      case 'QR_BADGE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-md border border-teal-400/20">
            <QrCode className="w-3 h-3" />
            QR Badge
          </span>
        );
      case 'MANUAL_OVERRIDE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-white/10">
            <ShieldCheck className="w-3 h-3" />
            Manager PIN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 dark:bg-slate-900/90 p-5 rounded-3xl border border-white/[0.08] shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40 shrink-0">
            <ScanFace className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tight">
                Employee Attendance Portal
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Cloud Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Biometric Attendance Tracking • {selectedBranch}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="px-3.5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
            title="Force sync with Supabase Cloud DB"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Cloud Sync'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedEmployeeForPunch(undefined);
              setIsPunchModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ScanFace className="w-4 h-4 stroke-[2.5]" />
            <span>Mark Attendance / Scan Biometrics</span>
          </button>
        </div>
      </div>

      {/* 2. FIVE-METRIC SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Staff */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Registered Staff
            </span>
            <div className="text-2xl font-black font-display text-white mt-0.5">
              {metrics.totalStaff}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              All departments active
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center border border-white/10">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
              Present Today
            </span>
            <div className="text-2xl font-black font-display text-emerald-300 mt-0.5">
              {metrics.totalActive}
            </div>
            <span className="text-[11px] text-emerald-400/90 mt-1 block font-semibold">
              {metrics.attendancePercentage}% Attendance Rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Late Arrivals */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-amber-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Late Arrivals
            </span>
            <div className="text-2xl font-black font-display text-amber-300 mt-0.5">
              {metrics.lateCount}
            </div>
            <span className="text-[11px] text-amber-300/80 mt-1 block">
              Grace period: 15 mins
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: On Break */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-blue-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block">
              On Shift Break
            </span>
            <div className="text-2xl font-black font-display text-blue-300 mt-0.5">
              {metrics.onBreakCount}
            </div>
            <span className="text-[11px] text-blue-300/80 mt-1 block">
              Floor & kitchen rotations
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Coffee className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Off Duty / Clocked Out */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Scheduled / Off
            </span>
            <div className="text-2xl font-black font-display text-slate-300 mt-0.5">
              {metrics.clockedOutCount + metrics.absentCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Evening shift pending
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-white/10">
            <LogOut className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. BIOMETRIC HARDWARE STATUS INDICATOR BANNER */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider">
            Active Hardware Terminals:
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Main Kiosk Scanner (Face ID)
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Kitchen Station Biometric (Thumb)
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Cloud PostgreSQL Live Stream
            </span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px]">
          Today: <strong className="text-white">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
        </div>
      </div>

      {/* 4. FILTER BAR */}
      <div className="p-4 bg-slate-900/80 rounded-3xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by staff name, ID (e.g. EMP-W101), role..."
            className="w-full bg-slate-800/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-800/90 border border-white/10 text-slate-200 text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-hidden focus:border-amber-400/60"
          >
            <option value="All">All Departments</option>
            <option value="Floor Service">Floor Service (Waiters)</option>
            <option value="Kitchen Brigade">Kitchen Brigade</option>
            <option value="Beverage & Bar">Beverage & Bar</option>
            <option value="Management">Management</option>
            <option value="Front of House">Front of House</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/90 border border-white/10 text-slate-200 text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-hidden focus:border-amber-400/60"
          >
            <option value="All">All Status</option>
            <option value="PRESENT">Present Only</option>
            <option value="LATE">Late Arrivals</option>
            <option value="ON_BREAK">On Break</option>
            <option value="CLOCKED_OUT">Clocked Out</option>
            <option value="ABSENT">Absent</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800/90 border border-white/10 text-slate-200 text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-hidden focus:border-amber-400/60"
          />
        </div>

      </div>

      {/* 5. ATTENDANCE ROSTER TABLE */}
      <div className="rounded-3xl border border-white/[0.08] bg-slate-900/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            
            {/* Table Header */}
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
              <tr>
                <th className="py-3.5 px-4 sm:px-5">Employee / Zone</th>
                <th className="py-3.5 px-4">Department &amp; Role</th>
                <th className="py-3.5 px-4">Shift Schedule</th>
                <th className="py-3.5 px-4">Clock-In</th>
                <th className="py-3.5 px-4">Clock-Out</th>
                <th className="py-3.5 px-4">Hours</th>
                <th className="py-3.5 px-4">Verification Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-5 text-right">Quick Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/[0.06] text-slate-200">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const emp = employees.find(e => e.id === rec.employeeId);

                  return (
                    <tr 
                      key={rec.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Employee Column */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={rec.avatarUrl} 
                            alt={rec.employeeName} 
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform" 
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs block">
                                {rec.employeeName}
                              </span>
                              <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold">
                                {rec.employeeCode}
                              </span>
                            </div>
                            {emp?.assignedZone && (
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                📍 {emp.assignedZone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200 block text-xs">
                          {rec.role}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {rec.department}
                        </span>
                      </td>

                      {/* Shift Schedule */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-300 block text-xs">
                          {emp?.shiftSchedule.name || 'General Shift'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {emp?.shiftSchedule.startTime} – {emp?.shiftSchedule.endTime}
                        </span>
                      </td>

                      {/* Clock In */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {rec.clockInTime ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            {rec.clockInTime}
                          </span>
                        ) : (
                          <span className="text-slate-500">--:--</span>
                        )}
                      </td>

                      {/* Clock Out */}
                      <td className="py-3.5 px-4 font-mono">
                        {rec.clockOutTime ? (
                          <span className="text-slate-300">{rec.clockOutTime}</span>
                        ) : (
                          <span className="text-slate-500">--:--</span>
                        )}
                      </td>

                      {/* Hours */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {rec.totalWorkHours > 0 ? `${rec.totalWorkHours}h` : '0h'}
                      </td>

                      {/* Verification Method */}
                      <td className="py-3.5 px-4">
                        {getMethodBadge(rec.verificationMethod)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(rec.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeForPunch(rec.employeeId);
                            setIsPunchModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-[11px] font-bold transition-all border border-white/10 active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <ScanFace className="w-3 h-3" />
                          <span>Punch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No attendance records match your search query.</p>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-950/40 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> staff attendance records
          </span>
          <span className="font-mono text-[11px] text-amber-400/90 font-bold">
            Cloud Sync ID: indiranagar_flagship_v1
          </span>
        </div>
      </div>

      {/* 6. BIOMETRIC PUNCH MODAL */}
      <AttendancePunchModal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        onSuccess={() => loadData()}
        employees={employees}
        selectedEmployeeId={selectedEmployeeForPunch}
      />

    </div>
  );
};

export default AttendancePage;
