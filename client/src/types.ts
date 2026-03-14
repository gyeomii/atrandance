export type ScheduleType = 'WED' | 'SAT' | 'SUN';
export type MemberType = 'OFFICER' | 'MEMBER';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

export type BasicSuccessResponse = ApiResponse<null>;

export interface Department {
  id: number;
  name: string;
}

export interface Member {
  id: number;
  department_id: number;
  name: string;
  is_active: boolean;
  gender?: string;
  member_type?: MemberType;
}

export interface DepartmentWithMembers extends Department {
  members: Member[];
}

export type DepartmentListResponse = ApiResponse<(Department | DepartmentWithMembers)[]>;

export interface DepartmentBulkUploadRow {
  department_name: string;
  member_name: string;
  gender?: string;
  member_type?: MemberType;
}

export interface DepartmentBulkUploadRequest {
  rows: DepartmentBulkUploadRow[];
  create_missing_departments?: boolean;
}

export interface DepartmentBulkUploadResult {
  created_departments: number;
  created_members: number;
  skipped_rows: string[];
}

export type DepartmentBulkUploadResponse = ApiResponse<DepartmentBulkUploadResult>;

export interface MemberCreateRequest {
  name: string;
  gender?: string;
  member_type?: MemberType;
}

export type MemberResponse = ApiResponse<Member>;
export type MemberListResponse = ApiResponse<Member[]>;

export interface Schedule {
  id: number;
  schedule_type: ScheduleType;
  date: string;
}

export interface AttendanceListMemberItem {
  member_id: number;
  name: string;
  present: boolean;
}

export interface AttendanceListData {
  schedule: Schedule;
  members: AttendanceListMemberItem[];
}

export type AttendanceListResponse = ApiResponse<AttendanceListData>;

export interface AttendanceMarkRequest {
  schedule_id: number;
  member_id: number;
  department_id: number;
  present: boolean;
}

export interface AttendanceRecord {
  id: number;
  schedule_id: number;
  member_id: number;
  department_id: number;
  status: 'PRESENT' | 'ABSENT';
  checked_at: string;
}

export type AttendanceRecordResponse = ApiResponse<AttendanceRecord>;

export interface AttendanceBulkUploadRow {
  date: string;
  schedule_type: ScheduleType;
  department_name: string;
  member_name: string;
}

export interface AttendanceBulkUploadRequest {
  rows: AttendanceBulkUploadRow[];
}

export interface AttendanceBulkUploadSkippedRow {
  date: string;
  schedule_type: string;
  department_name: string;
  member_name: string;
  reason: string;
}

export interface AttendanceBulkUploadResult {
  marked_count: number;
  skipped_rows: AttendanceBulkUploadSkippedRow[];
}

export type AttendanceBulkUploadResponse = ApiResponse<AttendanceBulkUploadResult>;

export interface DepartmentStats {
  department_id: number;
  department_name: string;
  present_count: number;
  total_members: number;
  attendance_rate: number;
}

export interface TotalStats {
  present_count: number;
  total_members: number;
  attendance_rate: number;
}

export interface WeeklyDashboardDay {
  date: string;
  schedule_type: ScheduleType;
  departments: DepartmentStats[];
  total: TotalStats;
}

export interface WeeklyDashboardData {
  range: { start: string; end: string };
  days: WeeklyDashboardDay[];
}

export type WeeklyDashboardResponse = ApiResponse<WeeklyDashboardData>;

export interface MonthlyDashboardDay {
  date: string;
  schedule_type: ScheduleType;
  departments: DepartmentStats[];
  total: TotalStats;
}

export interface MonthlyDashboardData {
  year: number;
  month: number;
  days: MonthlyDashboardDay[];
}

export type MonthlyDashboardResponse = ApiResponse<MonthlyDashboardData>;

export interface AttendanceByDepartmentDateEntry {
  date: string;
  departments: {
    department_id: number;
    department_name: string;
    present_count: number;
  }[];
}

export interface AttendanceByDepartmentData {
  schedule_type: ScheduleType;
  range: { start: string; end: string };
  dates: AttendanceByDepartmentDateEntry[];
}

export type AttendanceByDepartmentResponse = ApiResponse<AttendanceByDepartmentData>;

export interface RankingDepartmentEntry {
  rank: number;
  department_id: number;
  department_name: string;
  present_count: number;
  total_members: number;
  attendance_rate: number;
}

export interface RankingByDateData {
  date: string;
  schedule_type: ScheduleType;
  departments: RankingDepartmentEntry[];
}

export type RankingByDateResponse = ApiResponse<RankingByDateData>;
