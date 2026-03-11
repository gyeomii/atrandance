from sqlmodel import Session, select
from sqlalchemy import func
from datetime import date
from typing import List, Dict, Tuple, Optional
from app.models import Department, Member, Schedule, AttendanceRecord, AttendanceStatus, ScheduleType

class AttendanceRepository:
    def __init__(self, session: Session):
        self.session = session

    # --- Departments ---
    def get_all_departments(self) -> List[Department]:
        return self.session.exec(select(Department)).all()

    def get_department_by_id(self, dept_id: int) -> Optional[Department]:
        return self.session.get(Department, dept_id)

    def get_department_by_name(self, name: str) -> Optional[Department]:
        return self.session.exec(select(Department).where(Department.name == name)).first()

    def save_department(self, dept: Department) -> Department:
        self.session.add(dept)
        self.session.commit()
        self.session.refresh(dept)
        return dept

    def delete_department(self, dept: Department):
        self.session.delete(dept)
        self.session.commit()

    # --- Members ---
    def get_members_by_dept(self, dept_id: int) -> List[Member]:
        return self.session.exec(select(Member).where(Member.department_id == dept_id)).all()

    def get_member_by_id(self, member_id: int) -> Optional[Member]:
        return self.session.get(Member, member_id)

    def save_member(self, member: Member) -> Member:
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member

    def delete_member(self, member: Member):
        self.session.delete(member)
        self.session.commit()

    # --- Schedules ---
    def get_schedule(self, schedule_type: ScheduleType, target_date: date) -> Optional[Schedule]:
        return self.session.exec(select(Schedule).where(
            Schedule.schedule_type == schedule_type, Schedule.date == target_date
        )).first()

    def create_schedule(self, schedule: Schedule) -> Schedule:
        self.session.add(schedule)
        self.session.commit()
        self.session.refresh(schedule)
        return schedule

    def get_schedules(self, start_date: date, end_date: date, schedule_type: Optional[ScheduleType] = None) -> List[Schedule]:
        query = select(Schedule).where(Schedule.date >= start_date, Schedule.date <= end_date)
        if schedule_type:
            query = query.where(Schedule.schedule_type == schedule_type)
        return self.session.exec(query).all()

    # --- Attendance Records ---
    def get_attendance_records_by_schedule(self, schedule_id: int) -> List[AttendanceRecord]:
        return self.session.exec(select(AttendanceRecord).where(AttendanceRecord.schedule_id == schedule_id)).all()

    def get_attendance_record(self, schedule_id: int, member_id: int) -> Optional[AttendanceRecord]:
        return self.session.exec(select(AttendanceRecord).where(
            AttendanceRecord.schedule_id == schedule_id, AttendanceRecord.member_id == member_id
        )).first()

    def save_attendance_record(self, record: AttendanceRecord) -> AttendanceRecord:
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    # --- Statistics Aggregations ---
    def get_active_member_counts(self) -> Dict[int, int]:
        result = self.session.exec(
            select(Member.department_id, func.count(Member.id))
            .where(Member.is_active == True)
            .group_by(Member.department_id)
        ).all()
        return {row[0]: row[1] for row in result}

    def get_present_counts_by_schedules(self, schedule_ids: List[int]) -> Dict[Tuple[int, int], int]:
        if not schedule_ids: return {}
        result = self.session.exec(
            select(AttendanceRecord.schedule_id, AttendanceRecord.department_id, func.count(AttendanceRecord.id))
            .where(AttendanceRecord.schedule_id.in_(schedule_ids))
            .where(AttendanceRecord.status == AttendanceStatus.PRESENT)
            .group_by(AttendanceRecord.schedule_id, AttendanceRecord.department_id)
        ).all()
        return {(row[0], row[1]): row[2] for row in result}