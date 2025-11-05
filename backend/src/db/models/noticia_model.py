from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.db.database import Base


class Noticia(Base):
    """
    Modelo de notícia para armazenamento no banco de dados.

    Attributes
    - id: Identificador único da notícia
    - titulo: Título da notícia
    - resumo: Resumo da notícia
    - imagem: URL da imagem da notícia
    - data_postagem: Data de publicação da notícia
    - url: URL da notícia
    - id_fonte: Identificador da fonte da notícia
    - data_coleta: Data de coleta da notícia
    """

    __tablename__ = "noticias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    titulo = Column(String(200), nullable=False)
    resumo = Column(String(300), nullable=False)
    imagem = Column(String(2048), nullable=True)
    data_postagem = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    url = Column(String(2048), unique=True, nullable=False)
    id_fonte = Column(Integer, ForeignKey("fontes.id"), nullable=False)
    data_coleta = Column(DateTime(timezone=True), server_default=func.now())

    fonte = relationship("Fonte", back_populates="noticias")
    curtidas = relationship("Curtir", back_populates="noticia")

    def __repr__(self):
        return f"<Noticia(id={self.id}, titulo='{self.titulo}')>"