from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from src.db.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), default=datetime.utcnow)
    expira_em = Column(DateTime(timezone=True), nullable=False)
    ativo = Column(Boolean, default=True)

    usuario = relationship("Usuario")
