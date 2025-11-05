from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.database import Base


class Curtir(Base):
    """
    Modelo de curtida para armazenamento no banco de dados.

    Attributes:
    - id_usuario: Identificador do usuário que curtiu a notícia
    - id_noticia: Identificador da notícia que foi curtida
    - data_curtida: Data em que a curtida foi registrada
    """

    __tablename__ = "curtidas"

    id_usuario = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)
    id_noticia = Column(Integer, ForeignKey("noticias.id"), primary_key=True)
    data_curtida = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="curtidas")
    noticia = relationship("Noticia", back_populates="curtidas")

    def __repr__(self):
        return f"<Curtida(usuario={self.id_usuario}, noticia={self.id_noticia})>"
    