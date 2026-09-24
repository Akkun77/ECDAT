"""Bounded static snapshots. Never import or execute repository content."""
from pathlib import Path, PurePosixPath
import os
import re
import shutil
import stat
import uuid
import zipfile

from app.scanner.engine import ScannerEngine

SKIP = {"node_modules", "__pycache__", "venv", ".env"}
EXTENSIONS = set(ScannerEngine().extension_map)

class IntakeError(ValueError):
    pass

def new_workspace(settings):
    root = settings.data_dir.resolve() / "jobs"
    root.mkdir(parents=True, exist_ok=True)
    # tempfile.mkdtemp creates a Windows directory ACL that can prevent the
    # snapshotter from creating its nested source directories.  Create the
    # unique job directory using the parent runtime ACL instead.
    workspace = root / f"scan-{uuid.uuid4().hex}"
    workspace.mkdir()
    return workspace

def cleanup(path, settings):
    root = (settings.data_dir.resolve() / "jobs")
    path = Path(path).resolve()
    if path.parent != root or not path.name.startswith("scan-"):
        raise ValueError("Cleanup target is outside the controlled job directory")
    shutil.rmtree(path, ignore_errors=True)

def permitted_path(value, settings):
    path = Path(value).expanduser().resolve()
    roots = [p.resolve() for p in settings.allowed_roots]
    if not any(path.is_relative_to(root) for root in roots):
        raise IntakeError("Repository path is outside ECDAT_ALLOWED_ROOTS")
    if not path.is_dir():
        raise IntakeError("Repository path must name an existing directory")
    return path

def source_files(root):
    def fail(error):
        raise IntakeError("Repository contains an unreadable directory") from error
    for directory, dirs, files in os.walk(root, followlinks=False, onerror=fail):
        dirs[:] = sorted(d for d in dirs if d not in SKIP and not d.startswith("."))
        for name in dirs + files:
            p = Path(directory) / name
            if p.is_symlink() or p.is_junction():
                raise IntakeError("Repository symlinks and junctions are not supported")
        for name in sorted(files):
            p = Path(directory) / name
            if p.suffix.lower() in EXTENSIONS:
                yield p

def snapshot_local(source, destination, settings):
    count, size = 0, 0
    for path in source_files(source):
        if not path.resolve().is_relative_to(source.resolve()):
            raise IntakeError("Repository file escapes the permitted directory")
        count += 1
        if count > settings.max_files:
            raise IntakeError("Repository exceeds the supported-file count limit")
        # Bounded read also enforces the limit if the source grows after stat.
        with path.open("rb") as stream:
            data = stream.read(settings.max_file_bytes + 1)
        size += len(data)
        if len(data) > settings.max_file_bytes or size > settings.max_total_bytes:
            raise IntakeError("Repository exceeds source size limits")
        target = destination / path.relative_to(source)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    if not count:
        raise IntakeError("Repository is empty or contains no supported source files")
    return count

def extract_zip(archive, destination, settings):
    """Validate every member, then manually extract; never trust ZipFile.extract."""
    seen, members, total = set(), [], 0
    try:
        with zipfile.ZipFile(archive) as z:
            infos = z.infolist()
            if len(infos) > settings.max_zip_entries:
                raise IntakeError("ZIP contains too many entries")
            for entry in infos:
                name = entry.orig_filename
                path = PurePosixPath(name)
                parts = name.rstrip("/").split("/")
                # Windows ADS, drives, UNC, device names, normalization aliases.
                if (not name or any(ord(c) < 32 for c in name) or "\\" in name or ":" in name or path.is_absolute()
                    or any(p in ("", ".", "..") or p.endswith((" ", ".")) for p in parts)
                    or any(re.fullmatch(r"(?i)(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?", p) for p in parts)):
                    raise IntakeError("Unsafe ZIP path")
                key = name.rstrip("/").casefold()
                if key in seen:
                    raise IntakeError("Duplicate ZIP path")
                seen.add(key)
                mode = entry.external_attr >> 16
                if stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR):
                    raise IntakeError("ZIP links and special files are prohibited")
                if entry.flag_bits & 1:
                    raise IntakeError("Encrypted ZIP files are unsupported")
                if entry.file_size > settings.max_file_bytes:
                    raise IntakeError("ZIP member exceeds file size limit")
                total += entry.file_size
                if total > settings.max_total_bytes:
                    raise IntakeError("ZIP exceeds total expanded size limit")
                if entry.file_size > max(entry.compress_size, 1) * settings.max_ratio:
                    raise IntakeError("ZIP compression ratio exceeds limit")
                target = destination.joinpath(*parts).resolve()
                if not target.is_relative_to(destination.resolve()):
                    raise IntakeError("Unsafe ZIP path")
                members.append((entry, target))
            for entry, target in members:
                if entry.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with z.open(entry) as stream:
                    data = stream.read(settings.max_file_bytes + 1)
                if len(data) != entry.file_size or len(data) > settings.max_file_bytes:
                    raise IntakeError("ZIP member size mismatch")
                target.write_bytes(data)
        files = list(source_files(destination))
        if not files:
            raise IntakeError("ZIP is empty or contains no supported source files")
        if len(files) > settings.max_files:
            raise IntakeError("ZIP exceeds supported-file count limit")
        return len(files)
    except IntakeError:
        raise
    except (zipfile.BadZipFile, OSError, RuntimeError, NotImplementedError, ValueError) as exc:
        raise IntakeError("Invalid or unsupported ZIP archive") from exc

def private_key_files(root):
    # Conservative: suppress all evidence from a source file containing PEM private-key material.
    pattern = re.compile(rb"-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----")
    return {p.resolve() for p in source_files(root) if pattern.search(p.read_bytes())}

