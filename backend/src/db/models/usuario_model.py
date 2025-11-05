from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.db.database import Base


class Usuario(Base):
    """
    Modelo de usuário para armazenamento no banco de dados.
    
    Attributes
    - id: Identificador único do usuário
    - nome: Nome completo do usuário
    - email: Email único do usuário
    - senha_hash: Hash da senha do usuário
    - data_cadastro: Data de criação do registro
    - foto_perfil: URL da foto de perfil
    """

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    nome = Column(String(30), nullable=False)
    email = Column(String(254), unique=True, nullable=False)
    senha_hash = Column(Text, nullable=False)
    data_cadastro = Column(DateTime(timezone=True), server_default=func.now())
    foto_perfil = Column(String(255), nullable=True)

    curtidas = relationship("Curtir", back_populates="usuario")

    def __repr__(self):
        return f"<Usuario(id={self.id}, nome='{self.nome}', email='{self.email}')>"