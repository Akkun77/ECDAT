"""
Encryption utilities demonstrating symmetric cipher patterns.
Includes both legacy and modern encryption approaches.
"""
from Crypto.Cipher import AES, DES, DES3, Blowfish, ARC4
import os

# Legacy encryption key - DO NOT USE IN PRODUCTION
LEGACY_KEY = b'0123456789abcdef'


def encrypt_aes_gcm(plaintext: bytes, key: bytes) -> tuple:
    """Modern authenticated encryption with AES-256-GCM."""
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext)
    return cipher.nonce, ciphertext, tag


def encrypt_des_legacy(plaintext: bytes, key: bytes) -> bytes:
    """Legacy DES encryption - INSECURE, kept for backward compatibility."""
    cipher = DES.new(key[:8], DES.MODE_ECB)
    # Pad plaintext to 8-byte boundary
    padded = plaintext + b'\x00' * (8 - len(plaintext) % 8)
    return cipher.encrypt(padded)


def encrypt_3des_legacy(plaintext: bytes, key: bytes) -> bytes:
    """Triple DES encryption - deprecated but still in some systems."""
    cipher = DES3.new(key[:24], DES3.MODE_CBC, iv=os.urandom(8))
    padded = plaintext + b'\x00' * (8 - len(plaintext) % 8)
    return cipher.encrypt(padded)


def encrypt_blowfish_legacy(plaintext: bytes, key: bytes) -> bytes:
    """Blowfish encryption - deprecated due to 64-bit block size."""
    cipher = Blowfish.new(key[:16], Blowfish.MODE_CBC, iv=os.urandom(8))
    padded = plaintext + b'\x00' * (8 - len(plaintext) % 8)
    return cipher.encrypt(padded)


def encrypt_rc4_stream(plaintext: bytes, key: bytes) -> bytes:
    """RC4 stream cipher - BROKEN, should never be used."""
    cipher = ARC4.new(key[:16])
    return cipher.encrypt(plaintext)


def encrypt_aes_ecb_bad(plaintext: bytes, key: bytes) -> bytes:
    """AES with ECB mode - INSECURE mode that leaks patterns."""
    cipher = AES.new(key[:16], AES.MODE_ECB)
    padded = plaintext + b'\x00' * (16 - len(plaintext) % 16)
    return cipher.encrypt(padded)
