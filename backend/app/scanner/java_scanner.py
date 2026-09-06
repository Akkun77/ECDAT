import re
from app.core.models import ScannerFinding, Language, OperationType as Op, Confidence
from app.scanner.base_scanner import BaseScanner
from app.scanner.text_utils import mask_comments

class JavaScanner(BaseScanner):
    def supported_extensions(self):
        return {".java"}

    def scan_file(self, file_path, content):
        code = mask_comments(content)
        lines = content.splitlines()
        findings = []

        def add(m, algorithm, operation, rule, bits=None, mode=None, padding=None):
            line = code.count("\n", 0, m.start()) + 1
            end = code.count("\n", 0, m.end()) + 1
            findings.append(ScannerFinding(
                file_path=file_path, line_number=line, code_snippet="\n".join(lines[line-1:end]),
                language=Language.JAVA, library="javax.crypto" if operation == Op.SYMMETRIC_ENCRYPTION else "java.security",
                algorithm=algorithm, operation_type=operation, key_size=bits, mode=mode, padding=padding,
                detected_pattern=m[0], scanner_rule_id=rule, confidence=Confidence.MEDIUM))

        for m in re.finditer(r'MessageDigest\.getInstance\(\s*"([^"]+)"\s*\)', code):
            add(m, m[1], Op.HASH, "java-hash")
        for m in re.finditer(r'Cipher\.getInstance\(\s*"([^"]+)"\s*\)', code):
            parts = m[1].split("/")
            alg = {"DESede": "3DES"}.get(parts[0], parts[0])
            # RSA/ECB is a JCA transformation name, not symmetric ECB mode.
            mode = parts[1] if len(parts) > 1 and alg != "RSA" else None
            add(m, alg, Op.ASYMMETRIC_ENCRYPTION if alg == "RSA" else Op.SYMMETRIC_ENCRYPTION,
                "java-cipher", mode=mode, padding=parts[2] if len(parts) > 2 else None)
        for m in re.finditer(r'(\w+)\s*=\s*KeyPairGenerator\.getInstance\(\s*"RSA"\s*\)\s*;\s*\1\.initialize\(\s*(\d+)\s*\)', code):
            add(m, "RSA", Op.KEY_GENERATION, "java-rsa-keygen", int(m[2]))
        for m in re.finditer(r'Signature\.getInstance\(\s*"(MD5|SHA1|SHA256|SHA384|SHA512)with(RSA|ECDSA)"\s*\)', code):
            add(m, m[2], Op.SIGNATURE, "java-signature")
            findings[-1].notes = "signature_hash=" + m[1]
        for m in re.finditer(r"new\s+Random\s*\(", code):
            add(m, "insecure_random", Op.RANDOM, "java-insecure-prng")
        return findings

