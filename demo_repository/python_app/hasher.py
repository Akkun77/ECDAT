"""
Hash utility functions for the demo application.
Demonstrates various hash algorithm usage patterns.
"""
import hashlib


def compute_file_checksum_legacy(data: bytes) -> str:
    """Legacy checksum function still used in older modules."""
    return hashlib.md5(data).hexdigest()


def verify_data_integrity_v1(data: bytes, expected_hash: str) -> bool:
    """First version of integrity verification - uses SHA-1."""
    computed = hashlib.sha1(data).hexdigest()
    return computed == expected_hash


def compute_secure_hash(data: bytes) -> str:
    """Current recommended hash function."""
    return hashlib.sha256(data).hexdigest()


def compute_strong_hash(data: bytes) -> str:
    """Strong hash for sensitive operations."""
    return hashlib.sha512(data).hexdigest()


def hash_with_dynamic_algorithm(data: bytes, algo: str = "md5") -> str:
    """Dynamic hash selection - defaults to weak algorithm."""
    h = hashlib.new(algo)
    h.update(data)
    return h.hexdigest()
