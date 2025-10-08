from pydantic import BaseModel

class FonteResponse(BaseModel):
    nome: str
    url: str