from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from .models import MemberType, ScheduleType

# --- Common DTOs ---
class DateRangeDto(BaseModel):
    start: str
    end: str

class ScheduleDto(BaseModel):
    id: Optional[int]
    schedule_type: ScheduleType
    date: date

# --- Department DTOs ---
class DepartmentMemberDto(BaseModel):
    id: int
    name: str
    is_active: bool
    gender: Optional[str] = None
    member_type: Optional[MemberType] = None

class DepartmentWithMembersDto(BaseModel):
    id: int
    name: str
    members: Optional[List[DepartmentMemberDto]] = None

class BulkUploadResultDto(BaseModel):
    created_departments: int
    created_members: int
    skipped_rows: List[dict]


class AttendanceBulkUploadResultDto(BaseModel):
    marked_count: int
    skipped_rows: List[dict]

# --- Attendance DTOs ---
class AttendanceMemberDto(BaseModel):
    member_id: int
    name: str
    present: bool

class AttendanceListDto(BaseModel):
    schedule: ScheduleDto
    members: List[AttendanceMemberDto]

# --- Dashboard & Statistics DTOs ---
class TotalStatsDto(BaseModel):
    present_count: int
    total_members: int
    attendance_rate: float

class DepartmentStatsDto(BaseModel):
    department_id: int
    department_name: str
    present_count: int
    total_members: int
    attendance_rate: float
    rank: Optional[int] = None

class DailyStatsDto(BaseModel):
    date: str
    schedule_type: str
    departments: List[DepartmentStatsDto]
    total: TotalStatsDto

class WeeklyDashboardDto(BaseModel):
    range: DateRangeDto
    days: List[DailyStatsDto]

class MonthlyDashboardDto(BaseModel):
    year: int
    month: int
    days: List[DailyStatsDto]

class DepartmentSimpleStatsDto(BaseModel):
    department_id: int
    department_name: str
    present_count: int

class DailyDepartmentStatsDto(BaseModel):
    date: str
    departments: List[DepartmentSimpleStatsDto]

class AttendanceByDepartmentDto(BaseModel):
    schedule_type: str
    range: DateRangeDto
    dates: List[DailyDepartmentStatsDto]

class RankingByDateDto(BaseModel):
    date: str
    schedule_type: str
    departments: List[DepartmentStatsDto]