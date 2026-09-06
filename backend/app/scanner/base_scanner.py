from abc import ABC, abstractmethod
from app.core.models import ScannerFinding

class BaseScanner(ABC):
    @abstractmethod
    def scan_file(self, file_path: str, content: str) -> list[ScannerFinding]:
        ...
    
    @abstractmethod
    def supported_extensions(self) -> set[str]:
        ...
    
    def _make_snippet(self, lines: list[str], line_number: int, context: int = 0) -> str:
        start = max(0, line_number - 1 - context)
        end = min(len(lines), line_number + context)
        return "\n".join(lines[start:end])
