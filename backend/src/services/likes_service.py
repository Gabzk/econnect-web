from src.db.models.curtir_model import Curtir
from sqlalchemy.orm import Session

from src.db.models.usuario_model import Usuario


def _get_like(user_id: int, news_id: int, db: Session):
    return db.query(Curtir).filter(
        Curtir.id_usuario == user_id,
        Curtir.id_noticia == news_id
    ).first()

def handleLike(db: Session, usuario: Usuario, news_id: int):
    user_id = getattr(usuario, "id", None)
    if user_id is None:
        raise ValueError("Usuario instance does not have a valid 'id' attribute.")
    curtida = _get_like(user_id, news_id, db)
    if curtida:
        db.delete(curtida)
        db.commit()
        liked = False
    else:
        new_like = Curtir(id_usuario=user_id, id_noticia=news_id)
        db.add(new_like)
        db.commit()
        liked = True
    # Conta total de likes na notícia
    likes = db.query(Curtir).filter(Curtir.id_noticia == news_id).count()
    return {"liked": liked, "likes": likes}