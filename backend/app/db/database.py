import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# --- هذا هو الكود الصحيح الذي يتحقق من وجود قاعدة بيانات خارجية ---
# التحقق من وجود رابط قاعدة البيانات الخارجية في متغيرات البيئة
DATABASE_URL = os.environ.get("DATABASE_URL")

# إذا لم يتم العثور على الرابط الخارجي، استخدم قاعدة بيانات SQLite المحلية
if DATABASE_URL is None:
    print("DATABASE_URL not found, falling back to SQLite.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./translator.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
# إذا تم العثور عليه، استخدم PostgreSQL
else:
    print("DATABASE_URL found, connecting to PostgreSQL...")
    # تعديل بسيط على الرابط ليتوافق مع SQLAlchemy 1.4+
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    engine = create_engine(SQLALCHEMY_DATABASE_URL)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    print("Attempting to create database and tables...")
    Base.metadata.create_all(bind=engine)
    print("Database and tables creation process finished.")