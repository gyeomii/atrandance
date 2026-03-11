from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api_router import router
from app.database import create_db_and_tables


@asynccontextmanager
async def on_startup(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Church Attendance API", lifespan=on_startup)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router, prefix="/api")

# fastapi run --host 0.0.0.0 --workers 1
