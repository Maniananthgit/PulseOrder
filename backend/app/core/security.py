from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import base64
import bcrypt
from jose import jwt
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from app.core.config import settings
from app.core.logging import logger

# ============================================================================
# RSA Asymmetric Cryptography Manager
# ============================================================================
class RSAKeyManager:
    """
    Manages RSA 2048-bit asymmetric key pair for end-to-end payload encryption
    and digital signatures across Table Kiosks, Kitchen Displays, and Terminals.
    """
    _private_key = None
    _public_key = None

    @classmethod
    def get_or_create_keys(cls):
        if cls._private_key is None:
            logger.info("Initializing RSA 2048-bit asymmetric cryptographic key pair...")
            cls._private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
            cls._public_key = cls._private_key.public_key()
        return cls._private_key, cls._public_key

    @classmethod
    def get_public_pem(cls) -> str:
        """Returns the public key in standard PEM X.509 format for client devices."""
        _, public_key = cls.get_or_create_keys()
        return public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode("utf-8")

    @classmethod
    def encrypt_payload(cls, plaintext: str) -> str:
        """Encrypts sensitive strings (cards, pins, order auth) with RSA-OAEP SHA-256."""
        _, public_key = cls.get_or_create_keys()
        encrypted = public_key.encrypt(
            plaintext.encode("utf-8"),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.b64encode(encrypted).decode("utf-8")

    @classmethod
    def decrypt_payload(cls, encrypted_base64: str) -> str:
        """Decrypts RSA-OAEP SHA-256 encrypted base64 payload using private key."""
        private_key, _ = cls.get_or_create_keys()
        cipher_bytes = base64.b64decode(encrypted_base64.encode("utf-8"))
        decrypted = private_key.decrypt(
            cipher_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted.decode("utf-8")

    @classmethod
    def sign_payload(cls, data: str) -> str:
        """Produces cryptographic SHA256-with-RSA signature for verification."""
        private_key, _ = cls.get_or_create_keys()
        signature = private_key.sign(
            data.encode("utf-8"),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode("utf-8")

    @classmethod
    def verify_signature(cls, data: str, signature_b64: str) -> bool:
        """Verifies SHA256-with-RSA signature."""
        _, public_key = cls.get_or_create_keys()
        try:
            signature = base64.b64decode(signature_b64.encode("utf-8"))
            public_key.verify(
                signature,
                data.encode("utf-8"),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False


# ============================================================================
# Password Hashing & Verification (Bcrypt)
# ============================================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    plain_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(plain_bytes, salt).decode("utf-8")


# ============================================================================
# JWT Authentication Tokens
# ============================================================================
def create_access_token(
    subject: Union[str, Any],
    role: str,
    restaurant_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "restaurant_id": str(restaurant_id) if restaurant_id else None,
        "branch_id": str(branch_id) if branch_id else None,
        "exp": expire,
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
