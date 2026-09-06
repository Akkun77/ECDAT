from sqlalchemy import create_engine, String, Integer, Float, JSON, ForeignKey, select, update
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

class Base(DeclarativeBase):
    pass

class Scan(Base):
    __tablename__ = "scans"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_name: Mapped[str] = mapped_column(String)
    source_kind: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="QUEUED")
    progress: Mapped[float | None] = mapped_column(Float, nullable=True)
    files_scanned: Mapped[int] = mapped_column(Integer, default=0)
    total_files: Mapped[int | None] = mapped_column(Integer, nullable=True)
    languages: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[str] = mapped_column(String)
    completed_at: Mapped[str | None] = mapped_column(String, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cbom: Mapped[dict | None] = mapped_column(JSON, nullable=True)

class Finding(Base):
    __tablename__ = "findings"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), index=True)
    finding: Mapped[dict] = mapped_column(JSON)
    risk: Mapped[dict] = mapped_column(JSON)
    recommendation: Mapped[dict] = mapped_column(JSON)
    mosca: Mapped[dict | None] = mapped_column(JSON, nullable=True)

class Database:
    def __init__(self, data_dir):
        data_dir.mkdir(parents=True, exist_ok=True)
        self.engine = create_engine("sqlite:///" + (data_dir / "ecdat.sqlite3").resolve().as_posix(),
                                    connect_args={"check_same_thread": False, "timeout": 30})
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    def modify(self, scan_id, **values):
        with self.sessions.begin() as session:
            session.execute(update(Scan).where(Scan.id == scan_id).values(**values))

    def scan(self, scan_id):
        with self.sessions() as session:
            return session.get(Scan, scan_id)

    def findings(self, scan_id):
        with self.sessions() as session:
            return list(session.scalars(select(Finding).where(Finding.scan_id == scan_id).order_by(Finding.id)))

