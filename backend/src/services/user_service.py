from fastapi import File, HTTPException, UploadFile, status
from src.db.models.curtir_model import Curtir
from src.db.models.refresh_tokens_model import RefreshToken
from src.schemas.usuario_schema import (
    UpdateUsuario,
    UsuarioCreate,
    LoginSchema,
    UpdateUsuarioResponse,
)
from src.db.models.usuario_model import Usuario
from src.auth.password import hash_password, verify_password
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError


from typing import Optional

from src.utils.handle_user_image import save_user_image, delete_user_image


def create_usuario(
    usuario: UsuarioCreate, db: Session, image: Optional[UploadFile] = File(None)
):
    if not usuario.nome:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nome é obrigatório",
        )
    if not usuario.email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email é obrigatório",
        )
    if not usuario.senha:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Senha é obrigatória",
        )

    already_exists = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if already_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado"
        )

    # Corrige caso o Swagger envie string vazia no campo de imagem
    if image is not None and (isinstance(image, str) and image.strip() == ""):
        image = None

    new_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=hash_password(usuario.senha),
        foto_perfil=None,
    )

    db.add(new_usuario)
    db.commit()
    db.refresh(new_usuario)

    # Só tenta salvar a imagem se ela foi enviada corretamente
    if image:
        try:
            user_id = getattr(new_usuario, "id", None)
            if user_id is None:
                raise Exception("ID do usuário não encontrado após criação.")
            image_path = save_user_image(image, int(user_id))
            setattr(new_usuario, "foto_perfil", image_path)
            db.commit()
            db.refresh(new_usuario)
        except Exception:
            db.rollback()
            db.delete(new_usuario)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao salvar imagem de perfil. Usuário não foi criado.",
            )

    return new_usuario


def authenticate_usuario(credentials: LoginSchema, db: Session):
    try:
        db_usuario = (
            db.query(Usuario).filter(Usuario.email == credentials.email).first()
        )
        if not db_usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email não encontrado",
            )
        if not verify_password(credentials.senha, str(db_usuario.senha_hash)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Senha incorreta",
            )

        return db_usuario

    except HTTPException:
        raise

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro no servidor ao tentar autenticar. Por favor, tente novamente mais tarde.",
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro inesperado durante a autenticação.",
        )


def delete_usuario(usuario: Usuario, db: Session):
    try:
        # Deleta todas as curtidas do usuário e os refresh tokens relacionados
        db.query(Curtir).filter(Curtir.id_usuario == usuario.id).delete()
        db.query(RefreshToken).filter(RefreshToken.usuario_id == usuario.id).delete()
        delete_user_image(int(getattr(usuario, "id")))  # Deleta a imagem do usuário

        # Agora deleta o usuário
        db.delete(usuario)
        db.commit()

        return {"detail": f"Usuário {usuario.email} e curtidas removidos com sucesso"}

    except Exception as e:
        print(str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao deletar usuário.",
        )


def update_usuario(usuario: Usuario, db: Session, updated_usuario: UpdateUsuario):
    try:
        updated = False

        # Verifica o nome.
        if updated_usuario.nome is not None:
            if updated_usuario.nome.strip() == "":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Nome não pode ser vazio",
                )
            if updated_usuario.nome != usuario.nome:
                setattr(usuario, "nome", updated_usuario.nome)
                updated = True

        # Verifica o email.
        if updated_usuario.email is not None:
            if updated_usuario.email != usuario.email:
                existing_email = (
                    db.query(Usuario)
                    .filter(Usuario.email == updated_usuario.email)
                    .first()
                )
                if existing_email:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Email já cadastrado",
                    )
                setattr(usuario, "email", str(updated_usuario.email))
                updated = True

        # Verifica a senha.
        if updated_usuario.senha is not None:
            if updated_usuario.senha.strip() == "":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Senha não pode ser vazia",
                )
            if not verify_password(updated_usuario.senha, str(usuario.senha_hash)):
                setattr(usuario, "senha_hash", hash_password(updated_usuario.senha))
                updated = True

        if updated_usuario.foto_perfil is not None:
            filepath = save_user_image(
                updated_usuario.foto_perfil, getattr(usuario, "id")
            )
            setattr(usuario, "foto_perfil", filepath)
            updated = True

        if updated:
            db.commit()
            db.refresh(usuario)

        return UpdateUsuarioResponse(nome=str(usuario.nome), email=str(usuario.email))
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar usuário.",
        )
