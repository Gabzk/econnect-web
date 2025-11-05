from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.auth.auth import get_current_user
from src.db.database import get_db
from src.schemas.noticia_schema import NoticiaCreate, NoticiaResponse
from src.auth.api_key import verify_api_key
from src.services.likes_service import handleLike
from src.services.news_service import create_news, get_news_feed, get_news_by_id, get_liked_news
from dotenv import load_dotenv
import os

from src.services.rss_service import get_news_from_rss

load_dotenv()


news_router = APIRouter(
    prefix="/news", tags=["Notícias"], dependencies=[Depends(verify_api_key)]
)

@news_router.get("/feed/latest", response_model=list[NoticiaResponse])
def latest_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=10),  # Limite máximo de 10 notícias por vez
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    return get_news_feed(usuario, db, skip=skip, limit=limit)


@news_router.get("/feed/hotest", response_model=list[NoticiaResponse])
def hottest_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=10),  # Limite máximo de 10 notícias por vez
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    return get_news_feed(usuario, db, skip=skip, limit=limit, order_by="qtd_curtidas")


@news_router.get("/feed/liked", response_model=list[NoticiaResponse])
def liked_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=10),  # Limite máximo de 10 notícias por vez
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    return get_liked_news(usuario, db, skip=skip, limit=limit)

@news_router.get("/", response_model=NoticiaResponse)
def get_news(
    news_id: int, db: Session = Depends(get_db), usuario=Depends(get_current_user)
):
    return get_news_by_id(usuario, news_id, db)


@news_router.post("/handle-like/{news_id}")
def handle_like(
    news_id: int, db: Session = Depends(get_db), usuario=Depends(get_current_user)
):
    return handleLike(db, usuario, news_id)

#@news_router.post("/register", response_model=NoticiaResponse)
def register_news(
    news: NoticiaCreate,
    news_key: str,
    db: Session = Depends(get_db),
):
    if news_key != os.getenv("news_key"):
        raise HTTPException(
            status_code=401,
            detail="Chave de API inválida. Acesso negado.",
        )
    return create_news(news, db)

@news_router.post("/fetch-rss")
async def handle_rss_fetch(db: Session = Depends(get_db)):
     return await get_news_from_rss(db)