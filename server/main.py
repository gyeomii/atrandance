from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from app.api_router import router
from app.database import create_db_and_tables


@asynccontextmanager
async def on_startup(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Church Attendance API", lifespan=on_startup)


# 라우터 등록
app.include_router(router, prefix="/api")

# fastapi run --host 0.0.0.0 --workers 1
