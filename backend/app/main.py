# --- **التعديل الجوهري والنهائي هنا** ---
# استيراد دالة لتحميل متغيرات البيئة من ملف .env
from dotenv import load_dotenv

# قم بتشغيل الدالة كأول شيء على الإطلاق في التطبيق
# هذا يضمن أن جميع المتغيرات ستكون متاحة لكل الملفات الأخرى
load_dotenv()
# --- نهاية التعديل ---

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1 import endpoints as v1_endpoints
from app.db.database import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup...")
    create_db_and_tables()
    yield
    print("Application shutdown...")

app = FastAPI(title="Intelligent Translator API", lifespan=lifespan)

client_origin_url = os.environ.get("CLIENT_ORIGIN_URL", "http://localhost:3000")

origins = [
    client_origin_url,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_endpoints.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the Intelligent Translator Backend!"}