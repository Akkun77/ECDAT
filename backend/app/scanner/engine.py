import os
from typing import Callable, Optional
from app.core.models import ScannerFinding
from app.scanner.python_scanner import PythonScanner
from app.scanner.js_scanner import JSScanner
from app.scanner.java_scanner import JavaScanner

class ScannerEngine:
    def __init__(self):
        self.scanners = [
            PythonScanner(),
            JSScanner(),
            JavaScanner(),
        ]
        self.extension_map = {}
        for scanner in self.scanners:
            for ext in scanner.supported_extensions():
                self.extension_map[ext] = scanner

    def scan_directory(self, dir_path: str, progress_callback: Optional[Callable[[int, int], None]] = None) -> list[ScannerFinding]:
        if not os.path.isdir(dir_path):
            raise NotADirectoryError(dir_path)
        all_findings = []
        files_to_scan = []
        
        skip_dirs = {".git", "node_modules", "__pycache__", "venv", ".env"}
        
        def walk_error(error):
            raise error
        for root, dirs, files in os.walk(dir_path, onerror=walk_error):
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith('.')]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in self.extension_map:
                    files_to_scan.append(os.path.join(root, file))
                    
        total_files = len(files_to_scan)
        
        for i, file_path in enumerate(sorted(files_to_scan)):
            scanner = self.extension_map[os.path.splitext(file_path)[1].lower()]
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                findings = scanner.scan_file(file_path, content)
                all_findings.extend(findings)
            except Exception as e:
                raise RuntimeError(f"Cannot scan {file_path}: {e}") from e
                
            if progress_callback:
                progress_callback(i + 1, total_files)
                
        return all_findings
