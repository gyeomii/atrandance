import {
  DepartmentListResponse,
  DepartmentBulkUploadRequest,
  DepartmentBulkUploadResponse,
  MemberListResponse,
  MemberCreateRequest,
  MemberResponse,
  BasicSuccessResponse,
  AttendanceListResponse,
  AttendanceMarkRequest,
  AttendanceRecordResponse,
  WeeklyDashboardResponse,
  MonthlyDashboardResponse,
  AttendanceByDepartmentResponse,
  RankingByDateResponse,
  ScheduleType,
  DepartmentWithMembers,
  Member
} from './types';

// Mock Data Storage
let departments = [
  { id: 1, name: '청년1부' },
  { id: 2, name: '청년2부' }
];

let members: Member[] = [
  { id: 1, department_id: 1, name: '김철수', is_active: true },
  { id: 2, department_id: 1, name: '이영희', is_active: true },
  { id: 3, department_id: 2, name: '박지성', is_active: true }
];

let attendanceRecords = [
  { id: 1, schedule_id: 1, member_id: 1, department_id: 1, status: 'PRESENT', checked_at: '2026-03-08T10:00:00' }
];

let schedules = [
  { id: 1, schedule_type: 'SUN' as ScheduleType, date: '2026-03-08' }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // Departments
  getDepartments: async (includeMembers = false): Promise<DepartmentListResponse> => {
    await delay(300);
    const data = departments.map(d => {
      if (includeMembers) {
        return { ...d, members: members.filter(m => m.department_id === d.id) } as DepartmentWithMembers;
      }
      return d;
    });
    return { success: true, data, message: 'OK' };
  },
  
  createDepartment: async (name: string) => {
    await delay(300);
    const newDept = { id: Date.now(), name };
    departments.push(newDept);
    return { success: true, data: newDept, message: 'OK' };
  },

  deleteDepartment: async (id: number): Promise<BasicSuccessResponse> => {
    await delay(300);
    departments = departments.filter(d => d.id !== id);
    members = members.filter(m => m.department_id !== id);
    return { success: true, data: null, message: 'OK' };
  },

  bulkUploadDepartments: async (req: DepartmentBulkUploadRequest): Promise<DepartmentBulkUploadResponse> => {
    await delay(500);
    let createdDepts = 0;
    let createdMembers = 0;
    
    req.rows.forEach(row => {
      let dept = departments.find(d => d.name === row.department_name);
      if (!dept && req.create_missing_departments) {
        dept = { id: Date.now() + Math.random(), name: row.department_name };
        departments.push(dept);
        createdDepts++;
      }
      if (dept) {
        members.push({
          id: Date.now() + Math.random(),
          department_id: dept.id,
          name: row.member_name,
          is_active: true
        });
        createdMembers++;
      }
    });
    
    return {
      success: true,
      data: { created_departments: createdDepts, created_members: createdMembers, skipped_rows: [] },
      message: 'OK'
    };
  },

  // Members
  getMembers: async (deptId: number): Promise<MemberListResponse> => {
    await delay(300);
    return {
      success: true,
      data: members.filter(m => m.department_id === deptId),
      message: 'OK'
    };
  },

  addMember: async (deptId: number, req: MemberCreateRequest): Promise<MemberResponse> => {
    await delay(300);
    const newMember = { id: Date.now(), department_id: deptId, name: req.name, is_active: true };
    members.push(newMember);
    return { success: true, data: newMember, message: 'OK' };
  },

  deleteMember: async (memberId: number): Promise<BasicSuccessResponse> => {
    await delay(300);
    members = members.filter(m => m.id !== memberId);
    return { success: true, data: null, message: 'OK' };
  },

  // Attendance
  getAttendanceList: async (deptId: number, scheduleType: ScheduleType, date: string): Promise<AttendanceListResponse> => {
    await delay(300);
    let schedule = schedules.find(s => s.schedule_type === scheduleType && s.date === date);
    if (!schedule) {
      schedule = { id: Date.now(), schedule_type: scheduleType, date };
      schedules.push(schedule);
    }
    
    const deptMembers = members.filter(m => m.department_id === deptId);
    const listData = deptMembers.map(m => {
      const record = attendanceRecords.find(r => r.schedule_id === schedule!.id && r.member_id === m.id);
      return {
        member_id: m.id,
        name: m.name,
        present: record ? record.status === 'PRESENT' : false
      };
    });
    
    return {
      success: true,
      data: {
        schedule,
        members: listData
      },
      message: 'OK'
    };
  },

  markAttendance: async (req: AttendanceMarkRequest): Promise<AttendanceRecordResponse> => {
    await delay(100);
    let record = attendanceRecords.find(r => r.schedule_id === req.schedule_id && r.member_id === req.member_id);
    if (record) {
      record.status = req.present ? 'PRESENT' : 'ABSENT';
      record.checked_at = new Date().toISOString();
    } else {
      record = {
        id: Date.now(),
        schedule_id: req.schedule_id,
        member_id: req.member_id,
        department_id: req.department_id,
        status: req.present ? 'PRESENT' : 'ABSENT',
        checked_at: new Date().toISOString()
      };
      attendanceRecords.push(record);
    }
    return { success: true, data: record as any, message: 'OK' };
  },

  // Statistics
  getWeeklyDashboard: async (): Promise<WeeklyDashboardResponse> => {
    await delay(300);
    return {
      success: true,
      data: {
        range: { start: '2026-03-01', end: '2026-03-07' },
        days: [
          {
            date: '2026-03-01',
            schedule_type: 'SUN',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 18, total_members: 20, attendance_rate: 0.9 },
              { department_id: 2, department_name: '청년2부', present_count: 22, total_members: 25, attendance_rate: 0.88 }
            ],
            total: { present_count: 40, total_members: 45, attendance_rate: 0.88 }
          },
          {
            date: '2026-03-04',
            schedule_type: 'WED',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 10, total_members: 20, attendance_rate: 0.5 },
              { department_id: 2, department_name: '청년2부', present_count: 15, total_members: 25, attendance_rate: 0.6 }
            ],
            total: { present_count: 25, total_members: 45, attendance_rate: 0.55 }
          },
          {
            date: '2026-03-07',
            schedule_type: 'SAT',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 12, total_members: 20, attendance_rate: 0.6 },
              { department_id: 2, department_name: '청년2부', present_count: 18, total_members: 25, attendance_rate: 0.72 }
            ],
            total: { present_count: 30, total_members: 45, attendance_rate: 0.66 }
          }
        ]
      },
      message: 'OK'
    };
  },

  getMonthlyDashboard: async (): Promise<MonthlyDashboardResponse> => {
    await delay(300);
    return {
      success: true,
      data: {
        year: 2026,
        month: 3,
        days: [
          {
            date: '2026-03-01',
            schedule_type: 'SUN',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 17, total_members: 20, attendance_rate: 0.85 },
              { department_id: 2, department_name: '청년2부', present_count: 20, total_members: 25, attendance_rate: 0.8 }
            ],
            total: { present_count: 37, total_members: 45, attendance_rate: 0.82 }
          },
          {
            date: '2026-03-08',
            schedule_type: 'SUN',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 18, total_members: 20, attendance_rate: 0.9 },
              { department_id: 2, department_name: '청년2부', present_count: 22, total_members: 25, attendance_rate: 0.88 }
            ],
            total: { present_count: 40, total_members: 45, attendance_rate: 0.88 }
          }
        ]
      },
      message: 'OK'
    };
  },

  getAttendanceByDepartment: async (scheduleType: ScheduleType, startDate: string, endDate: string): Promise<AttendanceByDepartmentResponse> => {
    await delay(300);
    return {
      success: true,
      data: {
        schedule_type: scheduleType,
        range: { start: startDate, end: endDate },
        dates: [
          {
            date: '2026-03-01',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 15 },
              { department_id: 2, department_name: '청년2부', present_count: 20 }
            ]
          },
          {
            date: '2026-03-08',
            departments: [
              { department_id: 1, department_name: '청년1부', present_count: 18 },
              { department_id: 2, department_name: '청년2부', present_count: 22 }
            ]
          }
        ]
      },
      message: 'OK'
    };
  },

  getRankingByDate: async (date: string, scheduleType: ScheduleType): Promise<RankingByDateResponse> => {
    await delay(300);
    return {
      success: true,
      data: {
        date,
        schedule_type: scheduleType,
        departments: [
          { rank: 1, department_id: 2, department_name: '청년2부', present_count: 22, total_members: 25, attendance_rate: 0.88 },
          { rank: 2, department_id: 1, department_name: '청년1부', present_count: 18, total_members: 20, attendance_rate: 0.9 }
        ]
      },
      message: 'OK'
    };
  }
};
