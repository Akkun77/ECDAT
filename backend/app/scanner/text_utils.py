"""Comment masking for heuristic JS/Java scanners; preserve source offsets."""
import re

def mask_comments(source: str) -> str:
    tokens = r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|//[^\n]*|/\*[\s\S]*?\*/'''
    return re.sub(tokens, lambda m: re.sub(r"[^\n]", " ", m[0])
                  if m[0].startswith(("//", "/*")) else m[0], source)

