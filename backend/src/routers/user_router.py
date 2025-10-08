from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from src.auth.auth import get_current_user
from src.db.database import get_db
from src.auth.api_key import verify_api_key
from src.schemas.usuario_schema import UpdateUsuarioResponse, UpdateUsuario, UsuarioProfileResponse
from src.services.user_service import delete_usuario, update_usuario
from typing import Optional

user_router = APIRouter(
    prefix="/user", tags=["Usuário"], dependencies=[Depends(verify_api_key)]
)


@user_router.delete("/")
def delete(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    return delete_usuario(usuario, db)


@user_router.patch("/", response_model=UpdateUsuarioResponse)
def update(
    nome: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    senha: Optional[str] = Form(None),
    foto_perfil: UploadFile = File(None),
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    # Converte strings vazias para None para evitar erro de validação
    nome = nome if nome not in (None, "") else None
    email = email if email not in (None, "") else None
    senha = senha if senha not in (None, "") else None
    updated_usuario = UpdateUsuario(
        nome=nome, email=email, senha=senha, foto_perfil=foto_perfil
    )

    return update_usuario(usuario, db, updated_usuario)

@user_router.get("/", response_model=UsuarioProfileResponse)
def get_profile(usuario=Depends(get_current_user)):
    return UsuarioProfileResponse(
        nome=str(usuario.nome),
        email=str(usuario.email),
        foto_perfil= str(usuario.foto_perfil) if usuario.foto_perfil else None
    )