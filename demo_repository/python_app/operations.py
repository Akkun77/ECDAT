"""Static-only fixtures: demonstrate operation-specific RSA migration paths."""
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes


def sign_demo_document(document):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return key.sign(document, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())


def encrypt_demo_key_material(material):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return key.public_key().encrypt(material, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
