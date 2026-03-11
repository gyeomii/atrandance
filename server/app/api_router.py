from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from datetime import date

from app.database import get_session
from app.models import (
    APIResponse, DepartmentCreate, MemberCreateRequest, DepartmentBulkUploadRequest,
    AttendanceMarkRequest, ScheduleType, Department, Member, AttendanceRecord
)
from app.repository import AttendanceRepository
from app.service import AttendanceService
from dto import (
    DepartmentWithMembersDto, BulkUploadResultDto, AttendanceListDto,
    WeeklyDashboardDto, MonthlyDashboardDto, AttendanceByDepartmentDto, RankingByDateDto
)

router = APIRouter()

def get_repo(session: Session = Depends(get_session)) -> AttendanceRepository:
    return AttendanceRepository(session)

def get_service(repo: AttendanceRepository = Depends(get_repo)) -> AttendanceService:
    return AttendanceService(repo)

# --- Departments ---
@router.get("/departments", response_model=APIResponse[List[DepartmentWithMembersDto]])
def get_departments(include_members: bool = False, service: AttendanceService = Depends(get_service)):
    return {"data": service.get_departments_formatted(include_members)}

@router.post("/departments", response_model=APIResponse[Department])
def create_department(req: DepartmentCreate, service: AttendanceService = Depends(get_service)):
    return {"data": service.create_department(req)}

@router.delete("/departments/{dept_id}", response_model=APIResponse[None])
def delete_department(dept_id: int, service: AttendanceService = Depends(get_service)):
    service.delete_department(dept_id)
    return {"data": None}

@router.post("/departments/bulk", response_model=APIResponse[BulkUploadResultDto])
def bulk_upload_departments(req: DepartmentBulkUploadRequest, service: AttendanceService = Depends(get_service)):
    return {"data": service.bulk_upload_departments(req)}

# --- Members ---
@router.get("/departments/{dept_id}/members", response_model=APIResponse[List[Member]])
def get_members(dept_id: int, service: AttendanceService = Depends(get_service)):
    return {"data": service.get_members(dept_id)}

@router.post("/departments/{dept_id}/members", response_model=APIResponse[Member])
def add_member(dept_id: int, req: MemberCreateRequest, service: AttendanceService = Depends(get_service)):
    return {"data": service.add_member(dept_id, req)}

@router.delete("/members/{member_id}", response_model=APIResponse[None])
def delete_member(member_id: int, service: AttendanceService = Depends(get_service)):
    service.delete_member(member_id)
    return {"data": None}

# --- Attendance ---
@router.get("/attendance/{dept_id}", response_model=APIResponse[AttendanceListDto])
def get_attendance_list(dept_id: int, schedule_type: ScheduleType, date_str: str, service: AttendanceService = Depends(get_service)):
    target_date = date.fromisoformat(date_str)
    return {"data": service.get_attendance_list(dept_id, schedule_type, target_date)}

@router.post("/attendance", response_model=APIResponse[AttendanceRecord])
def mark_attendance(req: AttendanceMarkRequest, service: AttendanceService = Depends(get_service)):
    return {"data": service.mark_attendance(req)}

# --- Dashboards ---
@router.get("/dashboard/weekly", response_model=APIResponse[WeeklyDashboardDto])
def get_weekly_dashboard(start_date: str, end_date: str, service: AttendanceService = Depends(get_service)):
    s_date = date.fromisoformat(start_date)
    e_date = date.fromisoformat(end_date)
    return {"data": service.get_weekly_dashboard(s_date, e_date)}

@router.get("/dashboard/monthly", response_model=APIResponse[MonthlyDashboardDto])
def get_monthly_dashboard(year: int, month: int, service: AttendanceService = Depends(get_service)):
    return {"data": service.get_monthly_dashboard(year, month)}

@router.get("/dashboard/departments", response_model=APIResponse[AttendanceByDepartmentDto])
def get_attendance_by_department(schedule_type: ScheduleType, start_date: str, end_date: str, service: AttendanceService = Depends(get_service)):
    s_date = date.fromisoformat(start_date)
    e_date = date.fromisoformat(end_date)
    return {"data": service.get_attendance_by_department(schedule_type, s_date, e_date)}

@router.get("/dashboard/ranking", response_model=APIResponse[RankingByDateDto])
def get_ranking_by_date(target_date: str, schedule_type: ScheduleType, service: AttendanceService = Depends(get_service)):
    t_date = date.fromisoformat(target_date)
    return {"data": service.get_ranking_by_date(t_date, schedule_type)}