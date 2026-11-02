import { pushAttendanceToCloud, fetchAttendanceFromCloud } from './supabaseClient';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ON_BREAK' | 'CLOCKED_OUT' | 'ABSENT';
export type VerificationMethod = 'FACE_SCAN' | 'BIOMETRIC_THUMB' | 'QR_BADGE' | 'MANUAL_OVERRIDE';
export type StaffDepartment = 'Floor Service' | 'Kitchen Brigade' | 'Beverage & Bar' | 'Management' | 'Front of House';

export interface Employee {
  id: string;
  employeeCode: string; // 'EMP-101'
  name: string;
  role: string;
  department: StaffDepartment;
  phone: string;
  email: string;
  avatarUrl: string;
  shiftSchedule: {
    name: string;
    startTime: string; // '08:00 AM'
    endTime: string;   // '04:30 PM'
  };
  assignedZone?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: StaffDepartment;
  role: string;
  avatarUrl: string;
  date: string; // YYYY-MM-DD
  clockInTime: string | null;  // e.g. '08:02 AM'
  clockOutTime: string | null; // e.g. '04:30 PM'
  status: AttendanceStatus;
  verificationMethod: VerificationMethod;
  location: string;
  terminalId: string;
  totalWorkHours: number;
  notes?: string;
  verifiedAt: string;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  // Floor Concierges / Waiters
  {
    id: 'emp-w101',
    employeeCode: 'EMP-W101',
    name: 'Rajesh Kumar',
    role: 'Section Captain • Tables 16-20',
    department: 'Floor Service',
    phone: '+91 98450 33411',
    email: 'rajesh.k@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:00 AM', endTime: '04:30 PM' },
    assignedZone: 'Tables 16-20 (Zone 4)',
    status: 'ACTIVE'
  },
  {
    id: 'emp-w102',
    employeeCode: 'EMP-W102',
    name: 'Vikram Sethi',
    role: 'Floor Concierge • Tables 1-5',
    department: 'Floor Service',
    phone: '+91 98450 33412',
    email: 'vikram.s@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:00 AM', endTime: '04:30 PM' },
    assignedZone: 'Tables 1-5 (Zone 1)',
    status: 'ACTIVE'
  },
  {
    id: 'emp-w103',
    employeeCode: 'EMP-W103',
    name: 'Bala Subramanian',
    role: 'Floor Concierge • Tables 6-10',
    department: 'Floor Service',
    phone: '+91 98450 33413',
    email: 'bala.sub@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Full Day Shift', startTime: '11:00 AM', endTime: '11:00 PM' },
    assignedZone: 'Tables 6-10 (Zone 2)',
    status: 'ACTIVE'
  },
  {
    id: 'emp-w104',
    employeeCode: 'EMP-W104',
    name: 'Suresh Raina',
    role: 'Floor Concierge • Tables 11-15',
    department: 'Floor Service',
    phone: '+91 98450 33414',
    email: 'suresh.r@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Evening Shift', startTime: '03:30 PM', endTime: '11:30 PM' },
    assignedZone: 'Tables 11-15 (Zone 3)',
    status: 'ACTIVE'
  },
  {
    id: 'emp-w105',
    employeeCode: 'EMP-W105',
    name: 'Priya Nair',
    role: 'Guest Relations & Hostess',
    department: 'Floor Service',
    phone: '+91 98450 33415',
    email: 'priya.n@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:30 AM', endTime: '05:00 PM' },
    assignedZone: 'Reception & Grand Dining',
    status: 'ACTIVE'
  },

  // Kitchen Brigade
  {
    id: 'emp-k201',
    employeeCode: 'EMP-K201',
    name: 'Chef Vikram Sharma',
    role: 'Executive Head Chef',
    department: 'Kitchen Brigade',
    phone: '+91 98450 67890',
    email: 'vikram.chef@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:00 AM', endTime: '04:30 PM' },
    assignedZone: 'Main Fire Line & Expedition',
    status: 'ACTIVE'
  },
  {
    id: 'emp-k202',
    employeeCode: 'EMP-K202',
    name: 'Ustad Abdul Raheem',
    role: 'Clay-Oven Tandoor Master',
    department: 'Kitchen Brigade',
    phone: '+91 98450 67891',
    email: 'abdul.tandoor@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:00 AM', endTime: '04:30 PM' },
    assignedZone: 'Tandoor & Kebab Station',
    status: 'ACTIVE'
  },
  {
    id: 'emp-k203',
    employeeCode: 'EMP-K203',
    name: 'Sunita Rao',
    role: 'Lead Curry & Biryani Specialist',
    department: 'Kitchen Brigade',
    phone: '+91 98450 67892',
    email: 'sunita.curry@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:00 AM', endTime: '04:30 PM' },
    assignedZone: 'Curry & Dum Gravy Range',
    status: 'ACTIVE'
  },
  {
    id: 'emp-k204',
    employeeCode: 'EMP-K204',
    name: 'Karthik Reddy',
    role: 'KDS Kitchen Line Expeditor',
    department: 'Kitchen Brigade',
    phone: '+91 98450 67893',
    email: 'karthik.kds@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Full Day Shift', startTime: '10:30 AM', endTime: '10:30 PM' },
    assignedZone: 'KDS Display & Pass Station',
    status: 'ACTIVE'
  },

  // Beverage & Bar
  {
    id: 'emp-b301',
    employeeCode: 'EMP-B301',
    name: 'Ananya Desai',
    role: 'Lead Barista & Mixologist',
    department: 'Beverage & Bar',
    phone: '+91 98450 44551',
    email: 'ananya.bar@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:30 AM', endTime: '05:00 PM' },
    assignedZone: 'Beverage & Espresso Bar',
    status: 'ACTIVE'
  },

  // Management & Operations
  {
    id: 'emp-m401',
    employeeCode: 'EMP-M401',
    name: 'Arvind Singhania',
    role: 'General Manager',
    department: 'Management',
    phone: '+91 98450 11000',
    email: 'admin@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Executive Hours', startTime: '09:00 AM', endTime: '06:30 PM' },
    assignedZone: 'Store Administration',
    status: 'ACTIVE'
  },
  {
    id: 'emp-m402',
    employeeCode: 'EMP-M402',
    name: 'Meera Nambiar',
    role: 'Front Office & Billing Supervisor',
    department: 'Front of House',
    phone: '+91 98450 12345',
    email: 'meera.billing@royalember.com',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    shiftSchedule: { name: 'Morning Shift', startTime: '08:00 AM', endTime: '04:30 PM' },
    assignedZone: 'Cashier & Front Desk',
    status: 'ACTIVE'
  }
];

const STORAGE_KEYS = {
  EMPLOYEES: 'royal_ember_staff_employees_v1',
  ATTENDANCE: 'royal_ember_attendance_records_v1',
};

const BROADCAST_CHANNEL_NAME = 'royal_ember_attendance_channel_v1';
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // Graceful fallback for restricted environments
}

export const attendanceService = {
  // Get all registered employees
  getEmployees(): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load employees from local storage:', e);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  },

  // Save employees
  saveEmployees(employees: Employee[]) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  // Get attendance records for a specific date (defaults to today)
  getAttendanceRecords(dateStr?: string): AttendanceRecord[] {
    const today = dateStr || new Date().toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.ATTENDANCE}_${today}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read attendance records:', e);
    }

    // Generate initial baseline for today if not yet created
    const baseline = this.generateBaselineToday(today);
    localStorage.setItem(`${STORAGE_KEYS.ATTENDANCE}_${today}`, JSON.stringify(baseline));
    return baseline;
  },

  // Generate realistic initial baseline records for today
  generateBaselineToday(dateStr: string): AttendanceRecord[] {
    const employees = this.getEmployees();
    return employees.map((emp, index) => {
      // Create realistic varied attendance states
      let status: AttendanceStatus = 'PRESENT';
      let clockInTime: string | null = '08:02 AM';
      let clockOutTime: string | null = null;
      let method: VerificationMethod = 'FACE_SCAN';
      let totalWorkHours = 3.5;

      if (index === 0) {
        // Rajesh Kumar: Clocked in via Face Recognition
        status = 'PRESENT';
        clockInTime = '07:58 AM';
        method = 'FACE_SCAN';
        totalWorkHours = 3.8;
      } else if (index === 1) {
        // Vikram Sethi: Clocked in via Thumbprint
        status = 'PRESENT';
        clockInTime = '08:01 AM';
        method = 'BIOMETRIC_THUMB';
        totalWorkHours = 3.7;
      } else if (index === 2) {
        // Bala Subramanian: Shift starts 11:00 AM (just clocked in)
        status = 'PRESENT';
        clockInTime = '10:55 AM';
        method = 'FACE_SCAN';
        totalWorkHours = 0.5;
      } else if (index === 3) {
        // Suresh Raina: Evening Shift (Not yet clocked in / Scheduled)
        status = 'CLOCKED_OUT';
        clockInTime = null;
        method = 'QR_BADGE';
        totalWorkHours = 0;
      } else if (index === 4) {
        // Priya Nair: Late arrival
        status = 'LATE';
        clockInTime = '08:48 AM'; // shift was 08:30 AM
        method = 'FACE_SCAN';
        totalWorkHours = 2.8;
      } else if (index === 5) {
        // Chef Vikram Sharma: Head Chef present early
        status = 'PRESENT';
        clockInTime = '07:45 AM';
        method = 'BIOMETRIC_THUMB';
        totalWorkHours = 4.0;
      } else if (index === 6) {
        // Tandoor Master: Present
        status = 'PRESENT';
        clockInTime = '07:55 AM';
        method = 'FACE_SCAN';
        totalWorkHours = 3.9;
      } else if (index === 7) {
        // Sunita Rao: On Lunch Break
        status = 'ON_BREAK';
        clockInTime = '08:00 AM';
        method = 'FACE_SCAN';
        totalWorkHours = 3.0;
      } else if (index === 8) {
        // Karthik Reddy: Present
        status = 'PRESENT';
        clockInTime = '10:20 AM';
        method = 'QR_BADGE';
        totalWorkHours = 1.0;
      } else if (index === 9) {
        // Ananya Desai: Present
        status = 'PRESENT';
        clockInTime = '08:25 AM';
        method = 'FACE_SCAN';
        totalWorkHours = 3.2;
      } else if (index === 10) {
        // General Manager Arvind Singhania
        status = 'PRESENT';
        clockInTime = '08:50 AM';
        method = 'FACE_SCAN';
        totalWorkHours = 2.7;
      } else {
        // Meera Nambiar
        status = 'PRESENT';
        clockInTime = '08:05 AM';
        method = 'BIOMETRIC_THUMB';
        totalWorkHours = 3.6;
      }

      return {
        id: `att-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        department: emp.department,
        role: emp.role,
        avatarUrl: emp.avatarUrl,
        date: dateStr,
        clockInTime,
        clockOutTime,
        status,
        verificationMethod: method,
        location: 'Indiranagar Flagship - Main Kiosk',
        terminalId: 'KIOSK-TERMINAL-01',
        totalWorkHours,
        notes: status === 'LATE' ? 'Late by 18 mins due to metro delay' : undefined,
        verifiedAt: new Date().toISOString()
      };
    });
  },

  // Mark / Punch Attendance (Clock In, Clock Out, Start Break)
  async markAttendance(
    employeeId: string,
    action: 'CLOCK_IN' | 'CLOCK_OUT' | 'START_BREAK' | 'END_BREAK',
    method: VerificationMethod,
    notes?: string
  ): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const records = this.getAttendanceRecords(today);
    const employees = this.getEmployees();
    const employee = employees.find(e => e.id === employeeId);

    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    let existingRecord = records.find(r => r.employeeId === employeeId);

    if (!existingRecord) {
      existingRecord = {
        id: `att-${employee.id}-${today}`,
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employee.name,
        department: employee.department,
        role: employee.role,
        avatarUrl: employee.avatarUrl,
        date: today,
        clockInTime: null,
        clockOutTime: null,
        status: 'PRESENT',
        verificationMethod: method,
        location: 'Indiranagar Flagship - Main Kiosk',
        terminalId: 'KIOSK-TERMINAL-01',
        totalWorkHours: 0,
        verifiedAt: now.toISOString()
      };
      records.push(existingRecord);
    }

    // Apply action
    existingRecord.verificationMethod = method;
    existingRecord.verifiedAt = now.toISOString();
    if (notes) existingRecord.notes = notes;

    if (action === 'CLOCK_IN') {
      existingRecord.clockInTime = timeFormatted;
      // Determine if late based on shift
      const shiftHour = parseInt(employee.shiftSchedule.startTime.split(':')[0]);
      const currentHour = now.getHours();
      if (currentHour > shiftHour || (currentHour === shiftHour && now.getMinutes() > 15)) {
        existingRecord.status = 'LATE';
      } else {
        existingRecord.status = 'PRESENT';
      }
    } else if (action === 'CLOCK_OUT') {
      existingRecord.clockOutTime = timeFormatted;
      existingRecord.status = 'CLOCKED_OUT';
      existingRecord.totalWorkHours = Math.max(1, Math.round((existingRecord.totalWorkHours + 4) * 10) / 10);
    } else if (action === 'START_BREAK') {
      existingRecord.status = 'ON_BREAK';
    } else if (action === 'END_BREAK') {
      existingRecord.status = 'PRESENT';
    }

    // Save locally
    localStorage.setItem(`${STORAGE_KEYS.ATTENDANCE}_${today}`, JSON.stringify(records));

    // Broadcast across tabs
    try {
      broadcastChannel?.postMessage({
        type: 'ATTENDANCE_RECORDED',
        payload: existingRecord
      });
    } catch {
      // Ignored
    }

    // Push to Supabase Cloud Database asynchronously
    pushAttendanceToCloud({
      id: existingRecord.id,
      employee_id: existingRecord.employeeId,
      employee_code: existingRecord.employeeCode,
      employee_name: existingRecord.employeeName,
      department: existingRecord.department,
      role: existingRecord.role,
      date: existingRecord.date,
      clock_in_time: existingRecord.clockInTime,
      clock_out_time: existingRecord.clockOutTime,
      status: existingRecord.status,
      verification_method: existingRecord.verificationMethod,
      location: existingRecord.location,
      terminal_id: existingRecord.terminalId,
      total_work_hours: existingRecord.totalWorkHours,
      notes: existingRecord.notes,
      verified_at: existingRecord.verifiedAt
    }).catch(err => console.warn('Cloud attendance sync err:', err));

    return existingRecord;
  },

  // Calculate high-level attendance metrics for today
  getTodayMetrics(dateStr?: string) {
    const records = this.getAttendanceRecords(dateStr);
    const totalStaff = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_BREAK').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const clockedOutCount = records.filter(r => r.status === 'CLOCKED_OUT').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const onBreakCount = records.filter(r => r.status === 'ON_BREAK').length;

    const totalActive = presentCount + lateCount;
    const attendancePercentage = totalStaff > 0 ? Math.round(((totalActive + clockedOutCount) / totalStaff) * 100) : 100;

    return {
      totalStaff,
      presentCount,
      lateCount,
      clockedOutCount,
      absentCount,
      onBreakCount,
      totalActive,
      attendancePercentage
    };
  },

  // Sync with Cloud PostgreSQL Database on startup
  async syncWithCloud(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cloudData = await fetchAttendanceFromCloud(today);

      if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
        const localRecords = this.getAttendanceRecords(today);
        
        // Merge cloud records into local storage
        cloudData.forEach((cloudRow: any) => {
          const index = localRecords.findIndex(r => r.id === cloudRow.id || r.employeeId === cloudRow.employee_id);
          const mapped: AttendanceRecord = {
            id: cloudRow.id,
            employeeId: cloudRow.employee_id,
            employeeCode: cloudRow.employee_code,
            employeeName: cloudRow.employee_name,
            department: cloudRow.department,
            role: cloudRow.role,
            avatarUrl: cloudRow.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            date: cloudRow.attendance_date,
            clockInTime: cloudRow.clock_in_time,
            clockOutTime: cloudRow.clock_out_time,
            status: cloudRow.status,
            verificationMethod: cloudRow.verification_method || 'FACE_SCAN',
            location: cloudRow.location || 'Indiranagar Flagship - Main Kiosk',
            terminalId: cloudRow.terminal_id || 'KIOSK-TERMINAL-01',
            totalWorkHours: cloudRow.total_work_hours || 0,
            notes: cloudRow.notes,
            verifiedAt: cloudRow.verified_at || new Date().toISOString()
          };

          if (index >= 0) {
            localRecords[index] = mapped;
          } else {
            localRecords.push(mapped);
          }
        });

        localStorage.setItem(`${STORAGE_KEYS.ATTENDANCE}_${today}`, JSON.stringify(localRecords));
        console.log(`[Cloud DB] Synchronized ${cloudData.length} attendance records from PostgreSQL!`);
      }
    } catch (e) {
      console.warn('Attendance cloud sync failed, using local records:', e);
    }
  },

  // Subscribe to cross-tab realtime events
  onAttendanceChange(callback: (record: AttendanceRecord) => void): () => void {
    if (!broadcastChannel) return () => {};
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'ATTENDANCE_RECORDED' && event.data?.payload) {
        callback(event.data.payload as AttendanceRecord);
      }
    };
    broadcastChannel.addEventListener('message', handler);
    return () => broadcastChannel?.removeEventListener('message', handler);
  }
};
