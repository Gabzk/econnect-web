from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from src.auth.jwt import decode_token
from src.db.database import get_db
from src.db.models.usuario_model import Usuario

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)):
    
    payload = decode_token(token.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido.")
    usuario = db.query(Usuario).get(int(payload["sub"]))
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")
    return usuario