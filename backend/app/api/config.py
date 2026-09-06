"""Local prototype configuration. Paths are never supplied by uploaded code."""
from dataclasses import dataclass, field
import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]

@dataclass
class Settings:
    data_dir: Path = field(default_factory=lambda: Path(os.environ.get("ECDAT_DATA_DIR", PROJECT_ROOT / ".ecdat")))
    allowed_roots: list[Path] = field(default_factory=lambda: [
        Path(p) for p in json.loads(os.environ.get("ECDAT_ALLOWED_ROOTS", json.dumps([str(PROJECT_ROOT / "demo_repository")])))
    ])
    demo_dir: Path = field(default_factory=lambda: PROJECT_ROOT / "demo_repository")
    max_files: int = 1000
    max_file_bytes: int = 2 * 1024 * 1024
    max_total_bytes: int = 20 * 1024 * 1024
    max_upload_bytes: int = 10 * 1024 * 1024
    max_zip_entries: int = 2000
    max_ratio: int = 100
    max_pending_jobs: int = 4
    workers: int = 2

