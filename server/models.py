from datetime import date, datetime
from enum import Enum
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


# --- Enums ---
class ScheduleType(str, Enum):
    SUN = "SUN"
    WED = "WED"
    SAT = "SAT"


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"


# --- SQLModel Entities (Tables) ---
class Department(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    members: List["Member"] = Relationship(
        back_populates="department", cascade_delete=True
    )


class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    department_id: int = Field(foreign_key="department.id")
    name: str
    is_active: bool = Field(default=True)
    gender: Optional[str] = Field(default=None)
    department: Optional[Department] = Relationship(back_populates="members")


class Schedule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    schedule_type: ScheduleType
    date: date


class AttendanceRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    schedule_id: int = Field(foreign_key="schedule.id")
    member_id: int = Field(foreign_key="member.id")
    department_id: int = Field(foreign_key="department.id")
    status: AttendanceStatus
    checked_at: datetime = Field(default_factory=datetime.utcnow)


# --- Pydantic Schemas ---
T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str = "OK"


class DepartmentCreate(BaseModel):
    name: str


class MemberCreateRequest(BaseModel):
    name: str
    gender: Optional[str] = None


class DepartmentBulkRow(BaseModel):
    department_name: str
    member_name: str
    gender: Optional[str] = None


class DepartmentBulkUploadRequest(BaseModel):
    create_missing_departments: bool
    rows: List[DepartmentBulkRow]


class AttendanceMarkRequest(BaseModel):
    schedule_id: int
    member_id: int
    department_id: int
    present: bool
