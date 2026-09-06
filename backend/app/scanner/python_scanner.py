import ast
from app.core.models import ScannerFinding, Language, OperationType, Confidence, FindingCategory
from app.scanner.base_scanner import BaseScanner

class PythonScanner(BaseScanner):
    def supported_extensions(self) -> set[str]:
        return {".py"}

    def scan_file(self, file_path: str, content: str) -> list[ScannerFinding]:
        findings = []
        lines = content.splitlines()

        try:
            tree = ast.parse(content)
            visitor = CryptoASTVisitor(file_path, lines)
            visitor.visit(tree)
            findings.extend(visitor.findings)
        except (SyntaxError, ValueError, UnicodeDecodeError) as exc:
            raise ValueError(f"Invalid Python source: {file_path}") from exc

        return findings



class CryptoASTVisitor(ast.NodeVisitor):
    def __init__(self, file_path: str, lines: list[str]):
        self.file_path = file_path
        self.lines = lines
        self.findings = []
        self.aliases = {}
        self.key_bindings = {}
    
    def visit_Import(self, node):
        for name in node.names:
            alias = name.asname if name.asname else name.name
            self.aliases[alias] = name.name
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module:
            for name in node.names:
                alias = name.asname if name.asname else name.name
                self.aliases[alias] = f"{node.module}.{name.name}"
        self.generic_visit(node)
        
    def _resolve_name(self, node) -> str:
        if isinstance(node, ast.Name):
            return self.aliases.get(node.id, node.id)
        elif isinstance(node, ast.Attribute):
            base = self._resolve_name(node.value)
            return f"{base}.{node.attr}" if base else node.attr
        return ""

    def visit_FunctionDef(self, node):
        old_aliases, old_keys = self.aliases, self.key_bindings
        self.aliases, self.key_bindings = dict(old_aliases), {}
        for arg in (*node.args.posonlyargs, *node.args.args, *node.args.kwonlyargs):
            self.aliases.pop(arg.arg, None)
        for statement in node.body:
            self.visit(statement)
        self.aliases, self.key_bindings = old_aliases, old_keys

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Call(self, node):
        func_name = self._resolve_name(node.func)
        resolved_name = func_name
        for prefix in ("cryptography.hazmat.primitives.asymmetric.",
                       "cryptography.hazmat.primitives.ciphers.", "Crypto.Cipher.", "Crypto.PublicKey."):
            if func_name.startswith(prefix):
                func_name = func_name[len(prefix):]
                break
        
        if func_name in ["hashlib.md5", "hashlib.sha1", "hashlib.sha224"]:
            self._add_finding(node, "hashlib", func_name.split('.')[-1], OperationType.HASH, Confidence.HIGH, "py-weak-hash")
        elif func_name in ["hashlib.sha256", "hashlib.sha512"]:
            self._add_finding(node, "hashlib", func_name.split('.')[-1], OperationType.HASH, Confidence.HIGH, "py-acceptable-hash")
        elif func_name == "hashlib.new":
            if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                self._add_finding(node, "hashlib", node.args[0].value, OperationType.HASH, Confidence.HIGH, "py-dynamic-hash")
            else:
                self._add_finding(node, "hashlib", "dynamic_hash", OperationType.HASH, Confidence.LOW, "py-unresolved-hash")
        elif func_name in ["rsa.generate_private_key", "RSA.generate"]:
            key_size = None
            if func_name == "RSA.generate" and node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, int):
                key_size = node.args[0].value
            if func_name == "rsa.generate_private_key" and len(node.args) > 1 and isinstance(node.args[1], ast.Constant):
                key_size = node.args[1].value
            for kw in node.keywords:
                if kw.arg == 'key_size' and isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, int):
                    key_size = kw.value.value
            self._add_finding(node, "cryptography" if resolved_name.startswith("cryptography.") else "Crypto.PublicKey", "RSA", OperationType.KEY_GENERATION, Confidence.HIGH, "py-rsa-keygen", key_size)
        elif func_name == "ec.generate_private_key":
            curve = self._resolve_name(node.args[0].func).split(".")[-1] if node.args and isinstance(node.args[0], ast.Call) else None
            bits = {"SECP256R1": 256, "SECP384R1": 384, "SECP521R1": 521}.get(curve)
            self._add_finding(node, "cryptography", "ECC", OperationType.KEY_GENERATION, Confidence.HIGH, "py-ecc-keygen", bits)
            self.findings[-1].curve = curve
        elif func_name in ["algorithms.DES", "DES.new", "algorithms.ARC4", "ARC4.new", "algorithms.Blowfish", "Blowfish.new"]:
            self._add_finding(node, "crypto", {"DES": "DES", "ARC4": "RC4", "Blowfish": "Blowfish"}.get(func_name.split(".")[0] if func_name.endswith(".new") else func_name.split(".")[-1]), OperationType.SYMMETRIC_ENCRYPTION, Confidence.HIGH, "py-broken-cipher")
        elif func_name in ["algorithms.TripleDES", "DES3.new"]:
            self._add_finding(node, "crypto", "3DES", OperationType.SYMMETRIC_ENCRYPTION, Confidence.HIGH, "py-deprecated-cipher")
        elif func_name in ["AES.new", "algorithms.AES"]:
            bits = None
            if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, bytes):
                bits = len(node.args[0].value) * 8
            mode = next((self._resolve_name(a).split("MODE_")[-1] for a in node.args[1:] if "MODE_" in self._resolve_name(a)), None)
            self._add_finding(node, "Crypto.Cipher" if func_name == "AES.new" else "cryptography", "AES", OperationType.SYMMETRIC_ENCRYPTION, Confidence.HIGH, "py-aes", bits)
            self.findings[-1].mode = mode
        elif func_name in ["random.random", "random.randint", "random.choice", "random.choices", "random.randrange", "random.getrandbits"]:
            self._add_finding(node, "random", "insecure_random", OperationType.RANDOM, Confidence.HIGH, "py-insecure-prng")
        elif isinstance(node.func, ast.Attribute) and node.func.attr in ("sign", "verify", "encrypt", "decrypt", "exchange"):
            receiver = node.func.value
            if isinstance(receiver, ast.Call) and isinstance(receiver.func, ast.Attribute) and receiver.func.attr == "public_key":
                receiver = receiver.func.value
            binding = self.key_bindings.get(receiver.id) if isinstance(receiver, ast.Name) else None
            if binding:
                operation = OperationType.SIGNATURE if node.func.attr in ("sign", "verify") else OperationType.KEY_EXCHANGE if node.func.attr == "exchange" else OperationType.ASYMMETRIC_ENCRYPTION
                alg = "ECDSA" if binding.algorithm == "ECC" and operation == OperationType.SIGNATURE else binding.algorithm
                self._add_finding(node, binding.library, alg, operation, Confidence.MEDIUM, "py-key-operation", binding.key_size)
                self.findings[-1].curve = binding.curve
            
        self.generic_visit(node)

    def visit_Attribute(self, node):
        full_name = self._resolve_name(node)
        for prefix in ("cryptography.hazmat.primitives.ciphers.", "Crypto.Cipher."):
            if full_name.startswith(prefix):
                full_name = full_name[len(prefix):]
        if full_name in ["modes.ECB", "AES.MODE_ECB"]:
            self._add_finding(node, "crypto", "ECB", OperationType.SYMMETRIC_ENCRYPTION, Confidence.HIGH, "py-ecb-mode")
        elif full_name == "ssl.PROTOCOL_TLSv1":
            self._add_finding(node, "ssl", "tls_1_0", OperationType.PROTOCOL, Confidence.HIGH, "py-weak-tls")
        self.generic_visit(node)
        
    def visit_Assign(self, node):
        before = len(self.findings)
        for target in node.targets:
            if isinstance(target, ast.Name):
                name = target.id.lower()
                if any(k in name for k in ['password', 'secret', 'key', 'token', 'api_key']):
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        self._add_finding(node, "builtins", "Hardcoded Secret", OperationType.SECRET_STORAGE, Confidence.HIGH, "py-hardcoded-secret", category=FindingCategory.SECURITY_HYGIENE)
        self.generic_visit(node)
        generated = next((f for f in self.findings[before:] if f.operation_type == OperationType.KEY_GENERATION), None)
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.key_bindings.pop(target.id, None)
                self.aliases.pop(target.id, None)
                if generated and isinstance(node.value, ast.Call):
                    self.key_bindings[target.id] = generated

    def _add_finding(self, node, library, algorithm, operation_type, confidence, rule_id, key_size=None, category=FindingCategory.CRYPTOGRAPHIC):
        if library == "crypto":
            resolved = self._resolve_name(node.func if isinstance(node, ast.Call) else node)
            library = "Crypto.Cipher" if resolved.startswith("Crypto.") else "cryptography" if resolved.startswith("cryptography.") else library
        start = max(0, node.lineno - 1)
        end = min(len(self.lines), getattr(node, 'end_lineno', node.lineno))
        snippet = "\n".join(self.lines[start:end])
        
        self.findings.append(ScannerFinding(
            file_path=self.file_path,
            line_number=node.lineno,
            code_snippet=snippet,
            language=Language.PYTHON,
            library=library,
            algorithm=algorithm,
            operation_type=operation_type,
            key_size=key_size,
            detected_pattern="AST Match",
            scanner_rule_id=rule_id,
            confidence=confidence,
            category=category
        ))
