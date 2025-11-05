from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from src.auth.jwt import (
    create_access_token,
    create_refresh_token,
    revoke_refresh_token,
    verify_refresh_token,
)
from src.services.user_service import create_usuario, authenticate_usuario
from src.db.database import get_db
from src.schemas.usuario_schema import (
    UsuarioCreate,
    UsuarioResponse,
    Token,
    LoginSchema,
)
from src.auth.api_key import verify_api_key

auth_router = APIRouter(
    prefix="/auth", tags=["Autenticação"], dependencies=[Depends(verify_api_key)]
)


@auth_router.post("/register", response_model=UsuarioResponse)
async def register(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    try:
        usuario = UsuarioCreate(nome=nome, email=email, senha=senha)
        create_usuario(usuario, db, image)
        return UsuarioResponse(sucess=True, message="Cadastro efetuado com sucesso")
    except HTTPException as exc:
        # Propaga erros de validação customizados
        raise exc
    except Exception:
        raise HTTPException(
            status_code=500, detail="Erro inesperado ao cadastrar usuário."
        )


@auth_router.post("/login", response_model=Token)
def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    user = authenticate_usuario(credentials, db)

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)}, db=db)

    return Token(access_token=access_token, refresh_token=refresh_token)


@auth_router.post("/refresh", response_model=Token)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    payload = verify_refresh_token(refresh_token, db)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    id = payload.get("sub")
    revoke_refresh_token(refresh_token, db)
    new_access_token = create_access_token(data={"sub": id})
    new_refresh_token = create_refresh_token(data={"sub": id}, db=db)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)
