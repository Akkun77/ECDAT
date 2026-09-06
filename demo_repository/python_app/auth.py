"""
Authentication and key management module.
Demonstrates various asymmetric cryptography patterns.
"""
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend


def generate_legacy_signing_key():
    """Legacy key generation - insufficient key size."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=1024,
        backend=default_backend()
    )
    return private_key


def generate_current_signing_key():
    """Current production key generation."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    return private_key


def generate_strong_rsa_key():
    """Strong RSA key for high-security applications."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096,
        backend=default_backend()
    )
    return private_key


def generate_ecdsa_key():
    """ECDSA key generation for digital signatures."""
    private_key = ec.generate_private_key(
        ec.SECP256R1(),
        backend=default_backend()
    )
    return private_key


def sign_document(private_key, document: bytes) -> bytes:
    """Sign a document using RSA-PSS."""
    signature = private_key.sign(
        document,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return signature
