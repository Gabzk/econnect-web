# tests/test_news_service.py
import pytest
from unittest.mock import MagicMock, patch, call # Adicionado call para verificações mais detalhadas se necessário
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from src.services.news_service import (
    create_news,
    build_noticia_response,
    get_news_feed,
    get_news_by_id,
)
from src.db.models.noticia_model import Noticia
from src.db.models.fonte_model import Fonte
from src.db.models.usuario_model import Usuario
from src.db.models.curtir_model import Curtir
from src.schemas.noticia_schema import NoticiaCreate, NoticiaResponse
from src.schemas.fonte_schema import FonteResponse
from sqlalchemy import func


# --- Dados de Teste e Mocks Globais ---
@pytest.fixture
def mock_db_session():
    return MagicMock()


@pytest.fixture
def mock_usuario():
    usuario = MagicMock(spec=Usuario)
    usuario.id = 1
    return usuario

@pytest.fixture
def mock_fonte_model():
    fonte = MagicMock(spec=Fonte)
    fonte.id = 1
    fonte.nome = "Fonte Teste"
    fonte.url = "http://foneteste.com"
    return fonte

@pytest.fixture
def mock_noticia_model(mock_fonte_model):
    noticia = MagicMock(spec=Noticia)
    noticia.id = 1
    noticia.titulo = "Título da Notícia Teste"
    noticia.resumo = "Resumo da notícia teste."
    noticia.imagem = "http://imagemteste.com/img.jpg"
    noticia.data_postagem = datetime.now() - timedelta(days=1)
    noticia.url = "http://noticiateste.com/noticia1"
    noticia.id_fonte = mock_fonte_model.id
    noticia.data_coleta = datetime.now()
    noticia.fonte = mock_fonte_model  # Simula o relacionamento
    return noticia


@pytest.fixture
def noticia_create_data(mock_fonte_model):
    return NoticiaCreate(
        titulo="Nova Notícia",
        resumo="Este é o resumo da nova notícia.",
        imagem="http://exemplo.com/imagem.png",
        data_postagem=datetime.now(),
        url="http://exemplo.com/nova-noticia",
        id_fonte=mock_fonte_model.id,
    )


# --- Testes para create_news ---

def test_create_news_success(mock_db_session, noticia_create_data):
    mock_db_session.query(Noticia).filter().first.return_value = None  # Simula que não existe

    created_news = create_news(noticia_create_data, mock_db_session)

    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(mock_db_session.add.call_args[0][0])
    assert created_news.titulo == noticia_create_data.titulo
    assert created_news.url == noticia_create_data.url


@pytest.mark.parametrize(
    "missing_field, detail_message",
    [
        ("titulo", "Título é obrigatório"),
        ("resumo", "Resumo é obrigatório"),
        ("imagem", "Imagem é obrigatória"),
        ("url", "URL é obrigatória"),
        ("id_fonte", "ID da fonte é obrigatório"),
    ],
)
def test_create_news_missing_field(mock_db_session, noticia_create_data, missing_field, detail_message):
    # Criar um mock do objeto NoticiaCreate para passar para a função
    mock_invalid_news = MagicMock(spec=NoticiaCreate)

    # Atribuir todos os valores válidos do noticia_create_data
    for key, value in noticia_create_data.model_dump().items():
        setattr(mock_invalid_news, key, value)

    # Definir o campo problemático como None
    setattr(mock_invalid_news, missing_field, None)

    with pytest.raises(HTTPException) as exc_info:
        create_news(mock_invalid_news, mock_db_session) # Passa o mock

    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert exc_info.value.detail == detail_message


def test_create_news_already_exists(mock_db_session, noticia_create_data):
    mock_db_session.query(Noticia).filter(
        Noticia.url == noticia_create_data.url).first.return_value = Noticia()  # Simula que já existe

    with pytest.raises(HTTPException) as exc_info:
        create_news(noticia_create_data, mock_db_session)

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert exc_info.value.detail == "Notícia já cadastrada"


# --- Testes para build_noticia_response ---

def test_build_noticia_response_basic(mock_db_session, mock_noticia_model, mock_usuario, mock_fonte_model):
    # Simula a contagem de curtidas e se o usuário curtiu
    mock_db_session.query(Curtir).filter(Curtir.id_noticia == mock_noticia_model.id).count.return_value = 5
    mock_db_session.query(Curtir).filter(
        Curtir.id_noticia == mock_noticia_model.id, Curtir.id_usuario == mock_usuario.id
    ).first.return_value = MagicMock(spec=Curtir)  # Usuário curtiu

    response = build_noticia_response(mock_noticia_model, mock_usuario, mock_db_session)

    assert isinstance(response, NoticiaResponse)
    assert response.id == mock_noticia_model.id
    assert response.titulo == mock_noticia_model.titulo
    assert response.qtd_curtidas == 5
    assert response.curtido is True
    assert response.fonte is not None
    # Se FonteResponse tiver 'id', esta asserção é válida. Caso contrário, remova ou ajuste.
    # Assumindo que FonteResponse foi ajustado para ter 'id' como na sugestão anterior.
    # Se FonteResponse só tem nome e url:
    assert response.fonte.nome == mock_fonte_model.nome
    assert response.fonte.url == mock_fonte_model.url


def test_build_noticia_response_com_qtd_curtidas_passado(mock_db_session, mock_noticia_model, mock_usuario):
    # Usuário não curtiu
    mock_db_session.query(Curtir).filter(
        Curtir.id_noticia == mock_noticia_model.id, Curtir.id_usuario == mock_usuario.id
    ).first.return_value = None

    response = build_noticia_response(mock_noticia_model, mock_usuario, mock_db_session, qtd_curtidas=10)

    assert response.qtd_curtidas == 10
    assert response.curtido is False
    # Verifica se a query de contagem não foi chamada
    mock_db_session.query(Curtir).filter(Curtir.id_noticia == mock_noticia_model.id).count.assert_not_called()


def test_build_noticia_response_sem_fonte(mock_db_session, mock_usuario): # Removido mock_noticia_model daqui pois criamos um específico
    mock_noticia_model_sem_fonte = MagicMock(spec=Noticia)
    mock_noticia_model_sem_fonte.id = 2
    mock_noticia_model_sem_fonte.titulo = "Notícia Sem Fonte"
    mock_noticia_model_sem_fonte.resumo = "Resumo."
    mock_noticia_model_sem_fonte.imagem = "img.jpg"
    mock_noticia_model_sem_fonte.data_postagem = datetime.now()
    mock_noticia_model_sem_fonte.url = "url2"
    mock_noticia_model_sem_fonte.id_fonte = 99
    mock_noticia_model_sem_fonte.data_coleta = datetime.now()

    mock_db_session.query(Curtir).filter(Curtir.id_noticia == mock_noticia_model_sem_fonte.id).count.return_value = 0
    mock_db_session.query(Curtir).filter(
        Curtir.id_noticia == mock_noticia_model_sem_fonte.id, Curtir.id_usuario == mock_usuario.id
    ).first.return_value = None


# --- Testes para get_news_feed ---
def test_get_news_feed_order_by_data_postagem(mock_db_session, mock_usuario, mock_noticia_model):
    # Configura o mock da query para ordenação por data_postagem
    mock_query_obj = mock_db_session.query.return_value # Mock para o objeto query
    mock_ordered_query = mock_query_obj.order_by.return_value # Mock após order_by
    mock_offset_query = mock_ordered_query.offset.return_value # Mock após offset
    mock_limited_query = mock_offset_query.limit.return_value # Mock após limit
    mock_limited_query.all.return_value = [mock_noticia_model, mock_noticia_model]  # Duas notícias

    # Mocks para build_noticia_response dentro do loop
    # Ajustar para que o filtro de curtidas use o ID da notícia mockada
    mock_db_session.query(Curtir).filter(Curtir.id_noticia == mock_noticia_model.id).count.return_value = 2
    mock_db_session.query(Curtir).filter(
        Curtir.id_noticia == mock_noticia_model.id, Curtir.id_usuario == mock_usuario.id
    ).first.return_value = None  # Não curtiu

    feed = get_news_feed(mock_usuario, mock_db_session, skip=0, limit=10, order_by="data_postagem")

    assert len(feed) == 2
    assert feed[0].id == mock_noticia_model.id

    # Verifica se query(Noticia) foi chamado
    mock_db_session.query.assert_any_call(Noticia)
    # Verifica se order_by foi chamado no objeto query retornado
    mock_query_obj.order_by.assert_called_once()
    # Verifica se o atributo correto foi usado para ordenação
    assert mock_query_obj.order_by.call_args[0][0].element.key == 'data_postagem'
    mock_ordered_query.offset.assert_called_once_with(0)
    mock_offset_query.limit.assert_called_once_with(10)
    mock_limited_query.all.assert_called_once()


def test_get_news_feed_order_by_qtd_curtidas(mock_db_session, mock_usuario, mock_noticia_model):
    mock_query_curtidas = MagicMock()
    mock_db_session.query(Noticia, func.count(Curtir.id_usuario).label(
        "qtd_curtidas")).outerjoin().group_by().order_by().offset().limit.return_value = mock_query_curtidas
    mock_query_curtidas.all.return_value = [(mock_noticia_model, 5), (mock_noticia_model, 3)]
    mock_db_session.query(Curtir).filter(
        Curtir.id_noticia == mock_noticia_model.id, Curtir.id_usuario == mock_usuario.id
    ).first.return_value = MagicMock()

    feed = get_news_feed(mock_usuario, mock_db_session, skip=0, limit=10, order_by="qtd_curtidas")

    assert len(feed) == 2
    assert feed[0].id == mock_noticia_model.id
    assert feed[0].qtd_curtidas == 5
    assert feed[1].qtd_curtidas == 3
    assert feed[0].curtido is True
    mock_db_session.query(Curtir).filter(Curtir.id_noticia == mock_noticia_model.id).count.assert_not_called()


# --- Testes para get_news_by_id ---
def test_get_news_by_id_not_found(mock_db_session, mock_usuario):
    news_id_nao_existente = 999
    mock_db_session.query(Noticia).filter(Noticia.id == news_id_nao_existente).first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        get_news_by_id(mock_usuario, news_id_nao_existente, mock_db_session)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Notícia não encontrada"