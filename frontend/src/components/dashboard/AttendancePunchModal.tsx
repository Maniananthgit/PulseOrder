import React, { useState } from 'react';
import { 
  ScanFace, 
  Fingerprint, 
  QrCode, 
  UserCheck, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Camera,
  Coffee,
  LogOut,
  Building2,
  RefreshCw
} from 'lucide-react';
import { 
  attendanceService, 
  Employee, 
  VerificationMethod, 
  AttendanceRecord 
} from '../../services/attendanceService';
import { useKiosk } from '../../context/KioskContext';

interface AttendancePunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: AttendanceRecord) => void;
  employees: Employee[];
  selectedEmployeeId?: string;
}

export const AttendancePunchModal: React.FC<AttendancePunchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
  selectedEmployeeId
}) => {
  const { showToast } = useKiosk();
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    selectedEmployeeId || employees[0]?.id || ''
  );
  const [method, setMethod] = useState<VerificationMethod>('FACE_SCAN');
  const [action, setAction] = useState<'CLOCK_IN' | 'CLOCK_OUT' | 'START_BREAK' | 'END_BREAK'>('CLOCK_IN');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [punchSuccess, setPunchSuccess] = useState<AttendanceRecord | null>(null);

  if (!isOpen) return null;

  const currentEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  const handleStartScan = async () => {
    if (!currentEmployee) return;

    setIsScanning(true);
    setPunchSuccess(null);

    // Simulate realistic biometric scanning progression
    if (method === 'FACE_SCAN') {
      setScanStep('Aligning facial landmarks...');
    } else if (method === 'BIOMETRIC_THUMB') {
      setScanStep('Reading fingerprint ridges...');
    } else if (method === 'QR_BADGE') {
      setScanStep('Scanning staff QR token...');
    } else {
      setScanStep('Verifying supervisor credentials...');
    }

    setTimeout(() => {
      setScanStep('Matching against Cloud PostgreSQL database...');
    }, 600);

    setTimeout(async () => {
      try {
        const record = await attendanceService.markAttendance(
          currentEmployee.id,
          action,
          method,
          method === 'MANUAL_OVERRIDE' ? 'Manual supervisor authorization' : undefined
        );

        setScanStep('Verified & Synced with Cloud!');
        setIsScanning(false);
        setPunchSuccess(record);

        const actionText = 
          action === 'CLOCK_IN' ? 'Clocked In' :
          action === 'CLOCK_OUT' ? 'Clocked Out' :
          action === 'START_BREAK' ? 'Started Break' : 'Ended Break';

        showToast(`🎉 Attendance Marked: ${currentEmployee.name} ${actionText} via ${method.replace('_', ' ')}!`);
        onSuccess(record);

        // Auto-close after 2.2 seconds on success
        setTimeout(() => {
          onClose();
          setPunchSuccess(null);
        }, 2200);
      } catch (err) {
        console.error('Failed to mark attendance:', err);
        setIsScanning(false);
        showToast('❌ Attendance record failed. Please try again.');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900/95 text-slate-100 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-amber-500/30 overflow-hidden flex flex-col relative backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px]" />

        {/* HEADER */}
        <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/40">
              <ScanFace className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white tracking-tight">
                  Staff Attendance Kiosk
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Face Recognition, Biometric Thumb, or QR Badge Punch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-white/5 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* 1. SELECT EMPLOYEE */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Select Employee
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              disabled={isScanning}
              className="w-full bg-slate-800/90 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-hidden focus:border-amber-400/60"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                  {emp.employeeCode} - {emp.name} ({emp.department} • {emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Employee Card */}
          {currentEmployee && (
            <div className="p-3.5 rounded-2xl bg-slate-850/80 border border-white/[0.08] flex items-center gap-3">
              <img 
                src={currentEmployee.avatarUrl} 
                alt={currentEmployee.name} 
                className="w-12 h-12 rounded-xl object-cover border border-amber-400/30 shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm truncate">
                    {currentEmployee.name}
                  </h4>
                  <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                    {currentEmployee.employeeCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentEmployee.role} • {currentEmployee.department}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span>Shift: {currentEmployee.shiftSchedule.name} ({currentEmployee.shiftSchedule.startTime} - {currentEmployee.shiftSchedule.endTime})</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. CHOOSE PUNCH ACTION */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              2. Select Attendance Action
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAction('CLOCK_IN')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                  action === 'CLOCK_IN'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/15'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Clock In</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('CLOCK_OUT')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                  action === 'CLOCK_OUT'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/15'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Clock Out</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('START_BREAK')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                  action === 'START_BREAK'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/15'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Start Break</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('END_BREAK')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                  action === 'END_BREAK'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md shadow-blue-500/15'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>End Break</span>
              </button>
            </div>
          </div>

          {/* 3. CHOOSE BIOMETRIC / SCAN VERIFICATION METHOD */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              3. Verification Method (Face Scan / Thumb / QR / Manual)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMethod('FACE_SCAN')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border cursor-pointer ${
                  method === 'FACE_SCAN'
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-400/50 shadow-md'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <ScanFace className="w-5 h-5 text-amber-400" />
                <span>Face Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('BIOMETRIC_THUMB')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border cursor-pointer ${
                  method === 'BIOMETRIC_THUMB'
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-400/50 shadow-md'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-5 h-5 text-amber-400" />
                <span>Thumb Print</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('QR_BADGE')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border cursor-pointer ${
                  method === 'QR_BADGE'
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-400/50 shadow-md'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>Staff QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('MANUAL_OVERRIDE')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 border cursor-pointer ${
                  method === 'MANUAL_OVERRIDE'
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-400/50 shadow-md'
                    : 'bg-slate-800/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Manager PIN</span>
              </button>
            </div>
          </div>

          {/* 4. INTERACTIVE SCANNER VIEWFINDER */}
          <div className="relative rounded-2xl border border-dashed border-amber-400/30 p-6 bg-slate-950/60 flex flex-col items-center justify-center text-center overflow-hidden min-h-[170px]">
            {/* Animated Laser Scanning Line */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(245,158,11,1)] animate-bounce" />
            )}

            {punchSuccess ? (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h4 className="font-bold text-white text-base">
                  Attendance Confirmed!
                </h4>
                <p className="text-xs text-emerald-300">
                  Status: <strong>{punchSuccess.status}</strong> • Time: <strong>{punchSuccess.clockInTime || punchSuccess.clockOutTime}</strong>
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cloud PostgreSQL Synced • Device: KIOSK-TERMINAL-01
                </span>
              </div>
            ) : isScanning ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin flex items-center justify-center">
                    {method === 'FACE_SCAN' ? (
                      <ScanFace className="w-7 h-7 text-amber-400" />
                    ) : method === 'BIOMETRIC_THUMB' ? (
                      <Fingerprint className="w-7 h-7 text-amber-400" />
                    ) : (
                      <QrCode className="w-7 h-7 text-amber-400" />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-300 block animate-pulse">
                    {scanStep}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Live hardware sensor communication active
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center border border-white/10 shadow-md">
                  {method === 'FACE_SCAN' ? (
                    <Camera className="w-7 h-7" />
                  ) : method === 'BIOMETRIC_THUMB' ? (
                    <Fingerprint className="w-7 h-7" />
                  ) : method === 'QR_BADGE' ? (
                    <QrCode className="w-7 h-7" />
                  ) : (
                    <ShieldCheck className="w-7 h-7" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  Ready to scan {method === 'FACE_SCAN' ? 'Face' : method === 'BIOMETRIC_THUMB' ? 'Thumbprint' : method === 'QR_BADGE' ? 'Staff QR Badge' : 'Supervisor Authorization'}
                </p>
                <span className="text-[10px] text-slate-400">
                  Place face in viewfinder or touch scanner terminal to register attendance
                </span>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-5 bg-slate-950/80 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isScanning}
            className="px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-bold transition-all cursor-pointer border border-white/10 active:scale-95"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartScan}
            disabled={isScanning || !currentEmployee}
            className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Verifying Biometrics...</span>
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Mark Attendance Now →</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AttendancePunchModal;
