from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from src.db.database import Base

class Fonte(Base):
    """
    Modelo de fonte de notíticas para armazenamento no banco de dados

    Attributes:
    - id: Identificador único da fonte
    - url: URL da fonte
    - tipo_extracao: Tipo da fonte (RSS, API, Scraping)
    - nome: Nome da fonte
    """

    __tablename__ = "fontes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    url = Column(String(2048), unique=True, nullable=False)
    tipo_extracao = Column(String(15), nullable=False)
    nome = Column(String(30), nullable=False, unique=True)

    # Define a relação com o modelo Noticia
    noticias = relationship("Noticia", back_populates="fonte")

    def __repr__(self):
        return f"<Fonte(id={self.id}, url='{self.url}', tipo_extracao='{self.tipo_extracao}', nome='{self.nome}')>"