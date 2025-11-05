from fastapi import HTTPException, status
from jose import ExpiredSignatureError, jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import uuid

from src.db.models.refresh_tokens_model import RefreshToken

load_dotenv()

# Chave secreta
SECRET_KEY = os.getenv("jwt_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 3600
REFRESH_TOKEN_EXPIRATION_DAYS = 30


def create_access_token(data: dict):
    if not SECRET_KEY:
        raise ValueError("JWT secret key não está configurada")

    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    to_encode.update({"exp": expire, "type": "access"})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, db):
    if not SECRET_KEY:
        raise ValueError("JWT secret key não está configurada")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)
    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4())})

    refresh_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    db_token = RefreshToken(
        usuario_id=data["sub"], token=refresh_token, expira_em=expire
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)

    return refresh_token


def decode_token(token: str):
    if not SECRET_KEY:
        raise ValueError("JWT secret key não está configurada")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")



def verify_access_token(token: str):
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def verify_refresh_token(token: str, db):
    try:
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id is None:
                raise credentials_exception()
    except JWTError:
        raise credentials_exception()

    db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()

    if not db_token or not db_token.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked refresh token",
        )

   
    if db_token.expira_em < datetime.now(db_token.expira_em.tzinfo):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )

    return payload


def credentials_exception():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

def revoke_refresh_token(token: str, db):
    db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if db_token:
        db_token.ativo = False
        db.commit()