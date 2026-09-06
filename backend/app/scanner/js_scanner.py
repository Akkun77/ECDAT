import re
from app.core.models import ScannerFinding, Language, OperationType as Op, Confidence, FindingCategory
from app.scanner.base_scanner import BaseScanner
from app.scanner.text_utils import mask_comments

class JSScanner(BaseScanner):
    def supported_extensions(self):
        return {".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"}

    def scan_file(self, file_path, content):
        code = mask_comments(content)
        lines = content.splitlines()
        findings = []

        def add(m, algorithm, operation, rule, bits=None, mode=None, library="crypto"):
            line = code.count("\n", 0, m.start()) + 1
            end = code.count("\n", 0, m.end()) + 1
            findings.append(ScannerFinding(
                file_path=file_path, line_number=line, code_snippet="\n".join(lines[line-1:end]),
                language=Language.TYPESCRIPT if file_path.endswith((".ts", ".tsx")) else Language.JAVASCRIPT,
                library=library, algorithm=algorithm, operation_type=operation, key_size=bits,
                mode=mode, detected_pattern=m[0], scanner_rule_id=rule, confidence=Confidence.MEDIUM))

        for m in re.finditer(r'''crypto\.(?:createHash|subtle\.digest)\(\s*['"]([^'"]+)['"]''', code):
            add(m, m[1], Op.HASH, "js-hash")
        for m in re.finditer(r'''CryptoJS\.(MD5|SHA1|SHA256|SHA512)\(''', code):
            add(m, m[1], Op.HASH, "js-cryptojs-hash", library="CryptoJS")
        for m in re.finditer(r'''crypto\.(createCipheriv|createCipher)\(\s*['"]([^'"]+)['"]''', code):
            spec = m[2].lower()
            bits = re.search(r"aes-(128|192|256)", spec)
            algorithm = "AES" if bits else "3DES" if spec.startswith("des-ede") else "DES" if spec.startswith("des") else "RC4" if spec == "rc4" else spec
            mode = spec.rsplit("-", 1)[-1].upper()
            add(m, algorithm, Op.SYMMETRIC_ENCRYPTION, "js-cipher", int(bits[1]) if bits else None, mode)
            if m[1] == "createCipher":
                findings[-1].notes = "deprecated_createCipher"
        for m in re.finditer(r'''crypto\.generateKeyPair(?:Sync)?\(\s*['"]rsa['"]\s*,\s*\{[^}]*\}''', code):
            bits = re.search(r"modulusLength\s*:\s*(\d+)", m[0])
            add(m, "RSA", Op.KEY_GENERATION, "js-rsa-keygen", int(bits[1]) if bits else None)
        for m in re.finditer(r'''CryptoJS\.(DES|TripleDES|AES)\.encrypt\(''', code):
            add(m, m[1], Op.SYMMETRIC_ENCRYPTION, "js-cryptojs-cipher", library="CryptoJS")
        for m in re.finditer(r"CryptoJS\.mode\.ECB", code):
            add(m, "ECB", Op.SYMMETRIC_ENCRYPTION, "js-ecb", library="CryptoJS")
        for m in re.finditer(r"Math\.random\(", code):
            add(m, "insecure_random", Op.RANDOM, "js-insecure-prng", library="Math")
        for m in re.finditer(r'''(?i)\b(?:const|let|var)\s+\w*(?:password|api_?key|secret|token)\w*\s*=\s*['"][^'"\n]+['"]''', code):
            add(m, "hardcoded_secret", Op.SECRET_STORAGE, "js-hardcoded-secret", library="literal")
            findings[-1].category = FindingCategory.SECURITY_HYGIENE
        return findings

