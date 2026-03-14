from sqlmodel import Session, SQLModel, create_engine, text

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # Migration: add registered_at column for existing member tables that predate this field
    with Session(engine) as session:
        try:
            session.exec(text(
                "ALTER TABLE member ADD COLUMN registered_at DATE NOT NULL DEFAULT CURRENT_DATE"
            ))
            session.commit()
        except Exception:
            # Column already exists – nothing to do
            pass
