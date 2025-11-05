from datetime import datetime
from pydantic import BaseModel

from src.schemas.fonte_schema import FonteResponse

class NoticiaBase(BaseModel):
    titulo: str
    resumo: str
    imagem: str
    data_postagem: datetime
    url: str
    id_fonte: int

class NoticiaCreate(NoticiaBase):
    pass

class NoticiaResponse(NoticiaBase):
    id: int
    data_coleta: datetime
    qtd_curtidas: int
    curtido: bool
    fonte: FonteResponse


    class Config:
        from_attributes = True

