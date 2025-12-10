from typing import Optional

from fastapi import UploadFile
from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    """
    Esquema base para dados do usuário.

    Atributos:
    - nome (str): Nome do usuário.
    - email (EmailStr): Endereço de e-mail do usuário.
    """

    nome: str
    email: EmailStr


class UsuarioCreate(UsuarioBase):
    """
    Esquema para criação de um novo usuário.

    Herda de UsuarioBase e adiciona:
    - senha (str): Senha do usuário.
    """

    senha: str


class UsuarioResponse(BaseModel):
    """
    Esquema de resposta para operações relacionadas ao usuário.

    Atributos:
    - message (str): Mensagem descritiva do resultado.
    """

    message: str


class LoginSchema(BaseModel):
    """
    Esquema para dados de login do usuário.

    Atributos:
    - email (EmailStr): E-mail do usuário.
    - senha (str): Senha do usuário.
    """

    email: EmailStr
    senha: str


class Token(BaseModel):
    """
    Esquema para tokens de autenticação.

    Atributos:
    - refresh_token (str): Token de atualização.
    - access_token (str): Token de acesso.
    - token_type (str): Tipo do token (padrão: 'bearer').
    """

    refresh_token: str
    access_token: str
    token_type: str = "bearer"


class UpdateUsuario(BaseModel):
    """
    Esquema para atualização dos dados do usuário.

    Atributos
    - nome (Optional[str]): Nome do usuário (opcional).
    - email (Optional[EmailStr]): E-mail do usuário (opcional).
    - senha (Optional[str]): Senha do usuário (opcional).
    - foto_perfil (Optional[UploadFile]): Foto de perfil do usuário (opcional).
    """

    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    foto_perfil: Optional[UploadFile] = Field(default=None, exclude=True)

class UpdateUsuarioResponse(BaseModel):
    """
    Esquema de resposta para atualização de usuário.

    Atributos:
    - nome (str): Nome atualizado do usuário.
    - email (EmailStr): E-mail atualizado do usuário.
    """

    nome: str
    email: EmailStr

class UsuarioProfileResponse(BaseModel):
    """
    Esquema de resposta para perfil do usuário.

    Atributos:
    - nome (str): Nome do usuário.
    - email (EmailStr): E-mail do usuário.
    - foto_perfil (Optional[str]): Caminho/URL da imagem de perfil.
    """

    nome: str
    email: EmailStr
    dataCadastro: str
    foto_perfil: Optional[str] = None
