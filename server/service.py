import calendar
from datetime import date, datetime, timezone
from typing import List
from fastapi import HTTPException

from .models import (
    Department, Member, Schedule, AttendanceRecord, AttendanceStatus,
    ScheduleType, AttendanceMarkRequest, DepartmentCreate,
    MemberCreateRequest, DepartmentBulkUploadRequest, AttendanceBulkUploadRequest
)
from .repository import AttendanceRepository
from .dto import (
    DepartmentWithMembersDto, DepartmentMemberDto, BulkUploadResultDto,
    AttendanceListDto, ScheduleDto, AttendanceMemberDto, DailyStatsDto,
    DepartmentStatsDto, TotalStatsDto, WeeklyDashboardDto, DateRangeDto,
    MonthlyDashboardDto, AttendanceByDepartmentDto, DailyDepartmentStatsDto,
    DepartmentSimpleStatsDto, RankingByDateDto, AttendanceBulkUploadResultDto
)

class AttendanceService:
    def __init__(self, repo: AttendanceRepository):
        self.repo = repo

    # --- Departments ---
    def get_departments_formatted(self, include_members: bool) -> List[DepartmentWithMembersDto]:
        departments = self.repo.get_all_departments()
        result = []
        for d in departments:
            members = None
            if include_members:
                members = [DepartmentMemberDto(id=m.id, name=m.name, is_active=m.is_active, gender=m.gender, member_type=m.member_type) for m in d.members]
            result.append(DepartmentWithMembersDto(id=d.id, name=d.name, members=members))
        return result

    def create_department(self, req: DepartmentCreate) -> Department:
        return self.repo.save_department(Department(name=req.name))

    def delete_department(self, dept_id: int):
        dept = self.repo.get_department_by_id(dept_id)
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        self.repo.delete_department(dept)

    def bulk_upload_departments(self, req: DepartmentBulkUploadRequest) -> BulkUploadResultDto:
        created_depts = 0
        created_members = 0
        skipped_rows = []

        existing_depts = self.repo.get_all_departments()
        dept_cache = {d.name: d for d in existing_depts}

        for row in req.rows:
            dept = dept_cache.get(row.department_name)
            if not dept:
                if req.create_missing_departments:
                    new_dept = Department(name=row.department_name)
                    dept = self.repo.save_department(new_dept)
                    dept_cache[dept.name] = dept
                    created_depts += 1
                else:
                    skipped_rows.append(row.model_dump())
                    continue

            new_member = Member(department_id=dept.id, name=row.member_name, gender=row.gender, member_type=row.member_type)
            self.repo.save_member(new_member)
            created_members += 1

        return BulkUploadResultDto(
            created_departments=created_depts,
            created_members=created_members,
            skipped_rows=skipped_rows
        )

    # --- Members ---
    def get_members(self, dept_id: int) -> List[Member]:
        return self.repo.get_members_by_dept(dept_id)

    def add_member(self, dept_id: int, req: MemberCreateRequest) -> Member:
        if not self.repo.get_department_by_id(dept_id):
            raise HTTPException(status_code=404, detail="Department not found")
        return self.repo.save_member(Member(department_id=dept_id, name=req.name, gender=req.gender, member_type=req.member_type))

    def delete_member(self, member_id: int):
        member = self.repo.get_member_by_id(member_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        self.repo.delete_member(member)

    # --- Attendance ---
    def get_attendance_list(self, dept_id: int, schedule_type: ScheduleType, target_date: date) -> AttendanceListDto:
        schedule = self.repo.get_schedule(schedule_type, target_date)
        if not schedule:
            schedule = self.repo.create_schedule(Schedule(schedule_type=schedule_type, date=target_date))

        members = self.repo.get_members_by_dept(dept_id)
        records = self.repo.get_attendance_records_by_schedule(schedule.id)
        record_map = {r.member_id: r for r in records}

        member_dtos = [
            AttendanceMemberDto(
                member_id=m.id,
                name=m.name,
                present=record_map[m.id].status == AttendanceStatus.PRESENT if m.id in record_map else False
            ) for m in members
        ]

        schedule_dto = ScheduleDto(id=schedule.id, schedule_type=schedule.schedule_type, date=schedule.date)
        return AttendanceListDto(schedule=schedule_dto, members=member_dtos)

    def mark_attendance(self, req: AttendanceMarkRequest) -> AttendanceRecord:
        record = self.repo.get_attendance_record(req.schedule_id, req.member_id)
        new_status = AttendanceStatus.PRESENT if req.present else AttendanceStatus.ABSENT

        if record:
            record.status = new_status
            record.checked_at = datetime.now(timezone.utc)
        else:
            record = AttendanceRecord(schedule_id=req.schedule_id, member_id=req.member_id, department_id=req.department_id, status=new_status)
        return self.repo.save_attendance_record(record)

    def bulk_upload_attendance(self, req: AttendanceBulkUploadRequest) -> AttendanceBulkUploadResultDto:
        marked_count = 0
        skipped_rows = []

        existing_depts = self.repo.get_all_departments()
        dept_cache = {d.name: d for d in existing_depts}
        members_cache: dict[int, dict[str, Member]] = {}
        schedule_cache: dict[tuple, Schedule] = {}

        for row in req.rows:
            dept = dept_cache.get(row.department_name)
            if not dept:
                skipped_rows.append({**row.model_dump(), "reason": "부서를 찾을 수 없습니다."})
                continue

            if dept.id not in members_cache:
                members_cache[dept.id] = {m.name: m for m in self.repo.get_members_by_dept(dept.id)}
            member = members_cache[dept.id].get(row.member_name)
            if not member:
                skipped_rows.append({**row.model_dump(), "reason": "부서원을 찾을 수 없습니다."})
                continue

            try:
                target_date = date.fromisoformat(row.date)
            except ValueError:
                skipped_rows.append({**row.model_dump(), "reason": "날짜 형식이 올바르지 않습니다."})
                continue

            schedule_key = (row.schedule_type, target_date)
            if schedule_key not in schedule_cache:
                schedule = self.repo.get_schedule(row.schedule_type, target_date)
                if not schedule:
                    schedule = self.repo.create_schedule(Schedule(schedule_type=row.schedule_type, date=target_date))
                schedule_cache[schedule_key] = schedule
            else:
                schedule = schedule_cache[schedule_key]

            mark_req = AttendanceMarkRequest(
                schedule_id=schedule.id,
                member_id=member.id,
                department_id=dept.id,
                present=True
            )
            self.mark_attendance(mark_req)
            marked_count += 1

        return AttendanceBulkUploadResultDto(marked_count=marked_count, skipped_rows=skipped_rows)

    # --- Dashboards ---
    def _build_days_data(self, schedules: List[Schedule]) -> List[DailyStatsDto]:
        departments = self.repo.get_all_departments()
        member_counts = self.repo.get_active_member_counts()
        schedule_ids = [s.id for s in schedules if s.id is not None]
        present_counts = self.repo.get_present_counts_by_schedules(schedule_ids)

        days_data = []
        for sch in schedules:
            day_depts, day_total_present, day_total_members = [], 0, 0
            for dept in departments:
                total_members = member_counts.get(dept.id, 0)
                if total_members == 0: continue

                present_count = present_counts.get((sch.id, dept.id), 0)
                day_total_present += present_count
                day_total_members += total_members

                attendance_rate = round(present_count / total_members, 2) if total_members > 0 else 0.0

                day_depts.append(DepartmentStatsDto(
                    department_id=dept.id,
                    department_name=dept.name,
                    present_count=present_count,
                    total_members=total_members,
                    attendance_rate=attendance_rate
                ))

            total_attendance_rate = round(day_total_present / day_total_members, 2) if day_total_members > 0 else 0.0
            total_stats = TotalStatsDto(
                present_count=day_total_present,
                total_members=day_total_members,
                attendance_rate=total_attendance_rate
            )

            days_data.append(DailyStatsDto(
                date=sch.date.isoformat(),
                schedule_type=sch.schedule_type.value,
                departments=day_depts,
                total=total_stats
            ))
        return days_data

    def get_weekly_dashboard(self, start_date: date, end_date: date) -> WeeklyDashboardDto:
        schedules = self.repo.get_schedules(start_date, end_date)
        days_data = self._build_days_data(schedules)
        range_dto = DateRangeDto(start=start_date.isoformat(), end=end_date.isoformat())
        return WeeklyDashboardDto(range=range_dto, days=days_data)

    def get_monthly_dashboard(self, year: int, month: int) -> MonthlyDashboardDto:
        _, last_day = calendar.monthrange(year, month)
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        schedules = self.repo.get_schedules(start_date, end_date)
        days_data = self._build_days_data(schedules)
        return MonthlyDashboardDto(year=year, month=month, days=days_data)

    def get_attendance_by_department(self, schedule_type: ScheduleType, start_date: date, end_date: date) -> AttendanceByDepartmentDto:
        schedules = self.repo.get_schedules(start_date, end_date, schedule_type)
        days_data = self._build_days_data(schedules)

        dates_data = []
        for day in days_data:
            dept_simple_stats = [
                DepartmentSimpleStatsDto(
                    department_id=d.department_id,
                    department_name=d.department_name,
                    present_count=d.present_count
                ) for d in day.departments
            ]
            dates_data.append(DailyDepartmentStatsDto(date=day.date, departments=dept_simple_stats))

        range_dto = DateRangeDto(start=start_date.isoformat(), end=end_date.isoformat())
        return AttendanceByDepartmentDto(schedule_type=schedule_type.value, range=range_dto, dates=dates_data)

    def get_ranking_by_date(self, target_date: date, schedule_type: ScheduleType) -> RankingByDateDto:
        schedules = self.repo.get_schedules(target_date, target_date, schedule_type)
        if not schedules or not (days_data := self._build_days_data(schedules)):
            return RankingByDateDto(date=target_date.isoformat(), schedule_type=schedule_type.value, departments=[])

        departments_data = days_data[0].departments
        sorted_depts = sorted(departments_data, key=lambda x: x.attendance_rate, reverse=True)

        for idx, dept in enumerate(sorted_depts, 1):
            dept.rank = idx

        return RankingByDateDto(
            date=target_date.isoformat(),
            schedule_type=schedule_type.value,
            departments=sorted_depts
        )