"""
Utility functions with security hygiene issues.
"""
import random
import string

# Hardcoded credentials - security hygiene finding
DATABASE_PASSWORD = "super_secret_password_123"
API_SECRET_KEY = "sk-proj-abc123def456ghi789"
ENCRYPTION_KEY = "my-encryption-key-do-not-share"


def generate_session_token(length: int = 32) -> str:
    """Generate a session token using insecure random.
    
    WARNING: random.random() is not cryptographically secure.
    Should use secrets.token_hex() instead.
    """
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def generate_verification_code() -> str:
    """Generate a 6-digit verification code using insecure random."""
    return str(random.randint(100000, 999999))


def get_database_url() -> str:
    """Get database connection URL with embedded credentials."""
    password = DATABASE_PASSWORD
    return f"postgresql://admin:{password}@localhost:5432/mydb"
