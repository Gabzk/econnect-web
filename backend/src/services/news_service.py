from fastapi import HTTPException, status
from src.db.models.curtir_model import Curtir
from src.db.models.usuario_model import Usuario
from src.schemas.noticia_schema import NoticiaCreate, NoticiaResponse
from sqlalchemy.orm import Session
from src.db.models.noticia_model import Noticia
from src.schemas.fonte_schema import FonteResponse
from sqlalchemy import func


# Função para criar uma nova notícia no banco de dados
def create_news(news: NoticiaCreate, db: Session):
    # Validação dos campos obrigatórios
    if not news.titulo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Título é obrigatório",
        )
    if not news.resumo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resumo é obrigatório",
        )
    if not news.imagem:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Imagem é obrigatória",
        )
    if not news.url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="URL é obrigatória"
        )
    if not news.id_fonte:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ID da fonte é obrigatório",
        )

    # Verifica se já existe uma notícia com a mesma URL
    already_exists = db.query(Noticia).filter(Noticia.url == news.url).first()
    if already_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Notícia já cadastrada"
        )

    # Cria o objeto Noticia e salva no banco
    new_news = Noticia(
        titulo=news.titulo,
        resumo=news.resumo,
        imagem=news.imagem,
        data_postagem=news.data_postagem,
        url=news.url,
        id_fonte=news.id_fonte,
    )
    db.add(new_news)
    db.commit()
    db.refresh(new_news)
    return new_news


# Função auxiliar para montar o objeto de resposta da notícia
# Inclui quantidade de curtidas, se o usuário curtiu e dados da fonte


def build_noticia_response(noticia, usuario, db, qtd_curtidas=None):
    # Conta o número de curtidas se não for passado
    if qtd_curtidas is None:
        qtd_curtidas = db.query(Curtir).filter(Curtir.id_noticia == noticia.id).count()
    
    # Verifica se o usuário já curtiu essa notícia (se estiver autenticado)
    curtiu = (
        db.query(Curtir)
        .filter(Curtir.id_noticia == noticia.id, Curtir.id_usuario == usuario.id)
        .first()
        is not None
        if usuario is not None
        else False
    )
    
    # Converte o relacionamento da fonte para o schema Pydantic
    fonte_response = (
        FonteResponse.model_validate(noticia.fonte, from_attributes=True)
        if noticia.fonte
        else None
    )
    # Monta e retorna o schema de resposta
    return NoticiaResponse(
        id=noticia.id,
        titulo=noticia.titulo,
        resumo=noticia.resumo,
        imagem=noticia.imagem,
        data_postagem=noticia.data_postagem,
        url=noticia.url,
        id_fonte=noticia.id_fonte,
        data_coleta=noticia.data_coleta,
        qtd_curtidas=qtd_curtidas,
        curtido=curtiu,
        fonte=fonte_response,  # type: ignore
    )


# Função para buscar o feed de notícias, ordenando por data ou por curtidas
def get_news_feed(
    usuario: Usuario | None,
    db: Session,
    skip: int = 0,
    limit: int = 10,
    order_by: str = "data_postagem",
):
    # Ordena por quantidade de curtidas
    if order_by == "qtd_curtidas":
        noticias = (
            db.query(Noticia, func.count(Curtir.id_usuario).label("qtd_curtidas"))
            .outerjoin(Curtir, Noticia.id == Curtir.id_noticia)
            .group_by(Noticia.id)
            .order_by(func.count(Curtir.id_usuario).desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        # noticias é uma lista de tuplas: (Noticia, qtd_curtidas)
        return [
            build_noticia_response(noticia, usuario, db, qtd_curtidas=qtd_curtidas)
            for noticia, qtd_curtidas in noticias
        ]
    # Ordena por data de postagem (ou outro campo)
    else:
        noticias = (
            db.query(Noticia)
            .order_by(getattr(Noticia, order_by).desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [build_noticia_response(noticia, usuario, db) for noticia in noticias]

def get_liked_news(usuario: Usuario, db: Session, skip: int = 0, limit: int = 10):
    # Busca as curtidas do usuário e retorna as notícias correspondentes
    curtidas = (
        db.query(Curtir)
        .filter(Curtir.id_usuario == usuario.id)
        .order_by(Curtir.data_curtida.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    noticias = [db.query(Noticia).filter(Noticia.id == c.id_noticia).first() for c in curtidas]
    return [build_noticia_response(n, usuario, db) for n in noticias if n]


# Função para buscar uma notícia específica pelo ID
def get_news_by_id(usuario: Usuario | None, news_id: int, db: Session):
    noticia = db.query(Noticia).filter(Noticia.id == news_id).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return build_noticia_response(noticia, usuario, db)
