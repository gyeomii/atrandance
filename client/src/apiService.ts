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
  ApiResponse,
  Department,
} from './types';

const BASE_URL = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response.json();
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentKST(): Date {
  const kstString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  return new Date(kstString);
}

export const apiService = {
  // Departments
  getDepartments: async (includeMembers = false): Promise<DepartmentListResponse> => {
    return fetchApi(`/departments?include_members=${includeMembers}`);
  },

  createDepartment: async (name: string): Promise<ApiResponse<Department>> => {
    return fetchApi(`/departments`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  deleteDepartment: async (id: number): Promise<BasicSuccessResponse> => {
    return fetchApi(`/departments/${id}`, { method: 'DELETE' });
  },

  bulkUploadDepartments: async (req: DepartmentBulkUploadRequest): Promise<DepartmentBulkUploadResponse> => {
    return fetchApi(`/departments/bulk`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  // Members
  getMembers: async (deptId: number): Promise<MemberListResponse> => {
    return fetchApi(`/departments/${deptId}/members`);
  },

  addMember: async (deptId: number, req: MemberCreateRequest): Promise<MemberResponse> => {
    return fetchApi(`/departments/${deptId}/members`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  deleteMember: async (memberId: number): Promise<BasicSuccessResponse> => {
    return fetchApi(`/members/${memberId}`, { method: 'DELETE' });
  },

  // Attendance
  getAttendanceList: async (deptId: number, scheduleType: ScheduleType, date: string): Promise<AttendanceListResponse> => {
    return fetchApi(`/attendance/${deptId}?schedule_type=${scheduleType}&date_str=${date}`);
  },

  markAttendance: async (req: AttendanceMarkRequest): Promise<AttendanceRecordResponse> => {
    return fetchApi(`/attendance`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  // Statistics
  getWeeklyDashboard: async (): Promise<WeeklyDashboardResponse> => {
    const today = getCurrentKST();
    const dayOfWeek = today.getDay(); // 0=Sun
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return fetchApi(`/dashboard/weekly?start_date=${formatDate(sunday)}&end_date=${formatDate(saturday)}`);
  },

  getMonthlyDashboard: async (): Promise<MonthlyDashboardResponse> => {
    const today = getCurrentKST();
    return fetchApi(`/dashboard/monthly?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
  },

  getAttendanceByDepartment: async (scheduleType: ScheduleType, startDate: string, endDate: string): Promise<AttendanceByDepartmentResponse> => {
    return fetchApi(`/dashboard/departments?schedule_type=${scheduleType}&start_date=${startDate}&end_date=${endDate}`);
  },

  getRankingByDate: async (date: string, scheduleType: ScheduleType): Promise<RankingByDateResponse> => {
    return fetchApi(`/dashboard/ranking?target_date=${date}&schedule_type=${scheduleType}`);
  },
};

