import pytest
from unittest.mock import MagicMock, patch, call
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import BinaryExpression

from src.db.models.curtir_model import Curtir
from src.db.models.usuario_model import Usuario
from src.services.likes_service import handleLike, _get_like


@pytest.fixture
def mock_db_session():
    """Fixture para criar um mock da sessão do SQLAlchemy."""
    return MagicMock(spec=Session)


@pytest.fixture
def mock_usuario():
    """Fixture para criar um mock de um objeto Usuario com ID."""
    user = MagicMock(spec=Usuario)
    user.id = 1
    return user


@pytest.fixture
def mock_usuario_sem_id():
    """Fixture para criar um mock de um objeto Usuario sem ID."""
    user = MagicMock(spec=Usuario)
    # Simula a ausência do atributo 'id' ou 'id' sendo None
    # Se 'id' não estiver definido, getattr(user, "id", None) retornará None.
    # Para ser explícito, podemos deletar ou configurar para retornar None via configure_mock.
    del user.id  # Garante que o atributo 'id' não está presente
    return user


# Testes para a função auxiliar _get_like
def test_get_like_encontra_curtida_existente(mock_db_session):
    user_id = 1
    news_id = 100
    curtida_esperada = Curtir(id_usuario=user_id, id_noticia=news_id)

    mock_query_result = MagicMock()
    mock_filter_result = MagicMock()

    mock_db_session.query.return_value = mock_query_result
    mock_query_result.filter.return_value = mock_filter_result
    mock_filter_result.first.return_value = curtida_esperada

    curtida_encontrada = _get_like(user_id, news_id, mock_db_session)

    mock_db_session.query.assert_called_once_with(Curtir)

    # Verifica se filter foi chamado com os argumentos corretos
    # _get_like chama filter(Curtir.id_usuario == user_id, Curtir.id_noticia == news_id)
    mock_query_result.filter.assert_called_once()
    args_chamada_filter, _ = mock_query_result.filter.call_args
    assert len(args_chamada_filter) == 2
    assert isinstance(args_chamada_filter[0], BinaryExpression)
    assert isinstance(args_chamada_filter[1], BinaryExpression)
    assert str(args_chamada_filter[0]) == str(Curtir.id_usuario == user_id)
    assert str(args_chamada_filter[1]) == str(Curtir.id_noticia == news_id)

    mock_filter_result.first.assert_called_once()
    assert curtida_encontrada == curtida_esperada


def test_get_like_nao_encontra_curtida(mock_db_session):
    user_id = 1
    news_id = 101

    mock_query_result = MagicMock()
    mock_filter_result = MagicMock()

    mock_db_session.query.return_value = mock_query_result
    mock_query_result.filter.return_value = mock_filter_result
    mock_filter_result.first.return_value = None  # Simula que a curtida não foi encontrada

    curtida_encontrada = _get_like(user_id, news_id, mock_db_session)

    mock_db_session.query.assert_called_once_with(Curtir)
    mock_query_result.filter.assert_called_once()  # Argumentos já testados acima
    mock_filter_result.first.assert_called_once()
    assert curtida_encontrada is None


# Testes para a função handleLike
def test_handle_like_cria_nova_curtida(mock_db_session, mock_usuario):
    news_id = 200
    user_id = mock_usuario.id
    total_likes_esperado = 5

    with patch('src.services.likes_service._get_like', return_value=None) as mock_get_like_func:
        mock_count_query = MagicMock()
        mock_count_filter = MagicMock()
        mock_db_session.query.return_value = mock_count_query
        mock_count_query.filter.return_value = mock_count_filter
        mock_count_filter.count.return_value = total_likes_esperado

        with patch('src.services.likes_service.Curtir') as mock_curtir_constructor:
            mock_nova_curtida_instancia = MagicMock()
            mock_curtir_constructor.return_value = mock_nova_curtida_instancia
            # Para que a comparação de strings da expressão do filtro funcione,
            # precisamos que o mock_curtir_constructor.id_noticia se comporte como um atributo de coluna.
            # MagicMock geralmente lida bem com isso para `__eq__` e `__str__`.
            # Se `mock_curtir_constructor.id_noticia` precisasse de um nome específico para a string SQL,
            # você poderia configurá-lo:
            # mock_curtir_constructor.id_noticia.name = 'id_noticia' # Exemplo, pode não ser necessário

            resultado = handleLike(mock_db_session, mock_usuario, news_id)

            mock_get_like_func.assert_called_once_with(user_id, news_id, mock_db_session)
            mock_curtir_constructor.assert_called_once_with(id_usuario=user_id, id_noticia=news_id)
            mock_db_session.add.assert_called_once_with(mock_nova_curtida_instancia)
            mock_db_session.commit.assert_called_once()

            # Verifica a query de contagem
            mock_db_session.query.assert_called_once_with(mock_curtir_constructor)  # CORREÇÃO 1
            mock_count_query.filter.assert_called_once()
            args_chamada_filter_count, _ = mock_count_query.filter.call_args
            # CORREÇÃO 2: Use mock_curtir_constructor para construir a string da expressão esperada
            assert str(args_chamada_filter_count[0]) == str(mock_curtir_constructor.id_noticia == news_id)
            mock_count_filter.count.assert_called_once()

            assert resultado == {"liked": True, "likes": total_likes_esperado}




def test_handle_like_deleta_curtida_existente(mock_db_session, mock_usuario):
    news_id = 201
    user_id = mock_usuario.id
    curtida_existente_mock = Curtir(id_usuario=user_id, id_noticia=news_id)
    total_likes_esperado_apos_delete = 2

    # Mock _get_like para retornar uma curtida existente
    with patch('src.services.likes_service._get_like', return_value=curtida_existente_mock) as mock_get_like_func:
        # Mock para a query de contagem de likes
        mock_count_query = MagicMock()
        mock_count_filter = MagicMock()
        mock_db_session.query.return_value = mock_count_query
        mock_count_query.filter.return_value = mock_count_filter
        mock_count_filter.count.return_value = total_likes_esperado_apos_delete

        resultado = handleLike(mock_db_session, mock_usuario, news_id)

        mock_get_like_func.assert_called_once_with(user_id, news_id, mock_db_session)
        mock_db_session.delete.assert_called_once_with(curtida_existente_mock)
        mock_db_session.commit.assert_called_once()  # Um commit após deletar

        # Verifica a query de contagem
        mock_db_session.query.assert_called_once_with(Curtir)
        mock_count_query.filter.assert_called_once()
        args_chamada_filter_count, _ = mock_count_query.filter.call_args
        assert str(args_chamada_filter_count[0]) == str(Curtir.id_noticia == news_id)
        mock_count_filter.count.assert_called_once()

        assert resultado == {"liked": False, "likes": total_likes_esperado_apos_delete}


def test_handle_like_usuario_sem_id_levanta_valueerror(mock_db_session, mock_usuario_sem_id):
    news_id = 202

    with pytest.raises(ValueError) as exc_info:
        handleLike(mock_db_session, mock_usuario_sem_id, news_id)

    assert str(exc_info.value) == "Usuario instance does not have a valid 'id' attribute."
    mock_db_session.add.assert_not_called()
    mock_db_session.delete.assert_not_called()
    mock_db_session.commit.assert_not_called()
    mock_db_session.query.assert_not_called()  # Nenhuma query deve ocorrer