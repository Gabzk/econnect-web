import pytest
from unittest.mock import MagicMock, patch, mock_open, ANY
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from sqlalchemy.sql.elements import BinaryExpression # Para type checking
from src.services.user_service import (
    create_usuario,
    authenticate_usuario,
    delete_usuario,
    update_usuario,
)
from src.schemas.usuario_schema import UsuarioCreate, LoginSchema, UpdateUsuario
from src.db.models.usuario_model import Usuario
from src.db.models.curtir_model import Curtir
from src.db.models.refresh_tokens_model import RefreshToken


@pytest.fixture
def mock_db_session():
    return MagicMock()


@pytest.fixture
def mock_upload_file():
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test_image.png"
    mock_file.file = MagicMock()
    return mock_file


# Testes para create_usuario
def test_create_usuario_success(mock_db_session):
    usuario_data = UsuarioCreate(
        nome="Test User", email="test@example.com", senha="password123"
    )
    mock_db_session.query(Usuario).filter(
        Usuario.email == usuario_data.email
    ).first.return_value = None
    mock_db_session.add.return_value = None
    mock_db_session.commit.return_value = None
    mock_db_session.refresh.return_value = None

    with patch("src.services.user_service.hash_password", return_value="hashed_password"):
        new_usuario = create_usuario(usuario_data, mock_db_session)

    assert new_usuario.nome == usuario_data.nome
    assert new_usuario.email == usuario_data.email
    assert new_usuario.senha_hash == "hashed_password"
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()  # First commit for user creation
    mock_db_session.refresh.assert_called_once_with(new_usuario)


def test_create_usuario_success_with_image(mock_db_session, mock_upload_file):
    usuario_data = UsuarioCreate(
        nome="Test User Img", email="testimg@example.com", senha="password123"
    )
    mock_db_session.query(Usuario).filter(
        Usuario.email == usuario_data.email
    ).first.return_value = None

    # Mocking the new_usuario object that would be created
    created_user_mock = Usuario(id=1, nome=usuario_data.nome, email=usuario_data.email, senha_hash="hashed_password")

    def mock_add(instance):
        # Simulate setting the ID after adding to session (before commit)
        # In a real scenario, the ID is set after the first commit and refresh
        # For this test, we assume ID is available for save_user_image
        instance.id = 1

    mock_db_session.add.side_effect = mock_add

    # Simulate refresh populating the instance
    def mock_refresh(instance):
        instance.id = 1  # Ensure id is set on the instance passed to save_user_image
        return None

    mock_db_session.refresh.side_effect = mock_refresh

    with patch("src.services.user_service.hash_password", return_value="hashed_password"), \
            patch("src.services.user_service.save_user_image", return_value="path/to/image.png") as mock_save_image:
        # Simulate the user object after initial creation and refresh
        # This is a bit tricky because the ID is needed for save_user_image
        # We'll adjust the mock_db_session.refresh to set the ID on the object

        # We need to ensure that new_usuario has an ID before save_user_image is called.
        # The actual new_usuario object is created inside the function.
        # We can mock the Usuario constructor or ensure refresh sets the ID.

        # Let's refine the mock_refresh to ensure the instance passed to it gets an ID
        def side_effect_refresh(obj):
            obj.id = 1  # Simulate ID assignment after first commit/refresh

        mock_db_session.refresh.side_effect = side_effect_refresh

        new_usuario = create_usuario(usuario_data, mock_db_session, image=mock_upload_file)

    assert new_usuario.nome == usuario_data.nome
    assert new_usuario.email == usuario_data.email
    assert new_usuario.foto_perfil == "path/to/image.png"
    mock_save_image.assert_called_once_with(mock_upload_file, 1)
    assert mock_db_session.commit.call_count == 2  # User creation + image path update


def test_create_usuario_missing_nome(mock_db_session):
    usuario_data = UsuarioCreate(nome="", email="test@example.com", senha="password123")
    with pytest.raises(HTTPException) as exc_info:
        create_usuario(usuario_data, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert exc_info.value.detail == "Nome é obrigatório"


def test_create_usuario_schema_validation_fails_for_empty_email(mock_db_session):
    """
    Testa se a instanciação de UsuarioCreate falha com ValidationError
    quando um email vazio é fornecido, devido à validação do Pydantic (provavelmente EmailStr).
    """
    with pytest.raises(ValidationError) as exc_info:
        UsuarioCreate(nome="Test", email="", senha="password123")

    # Verifica os detalhes do erro de validação do Pydantic
    assert len(exc_info.value.errors()) == 1
    error_detail = exc_info.value.errors()[0]
    assert error_detail['type'] == 'value_error' # Ou o tipo de erro específico para e-mail
    assert error_detail['loc'] == ('email',)
    assert "value is not a valid email address" in error_detail['msg'] # Ou a mensagem específica do EmailStr

    # A função create_usuario não deve ser chamada, então os mocks do db_session não devem ser acionados
    mock_db_session.query.assert_not_called()
    mock_db_session.add.assert_not_called()
    mock_db_session.commit.assert_not_called()

def test_create_usuario_missing_senha(mock_db_session):
    usuario_data = UsuarioCreate(nome="Test", email="test@example.com", senha="")
    with pytest.raises(HTTPException) as exc_info:
        create_usuario(usuario_data, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert exc_info.value.detail == "Senha é obrigatória"


def test_create_usuario_email_exists(mock_db_session):
    usuario_data = UsuarioCreate(
        nome="Test User", email="exists@example.com", senha="password123"
    )
    mock_db_session.query(Usuario).filter(
        Usuario.email == usuario_data.email
    ).first.return_value = Usuario(email=usuario_data.email)

    with pytest.raises(HTTPException) as exc_info:
        create_usuario(usuario_data, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert exc_info.value.detail == "Email já cadastrado"


def test_create_usuario_with_image_save_fails(mock_db_session, mock_upload_file):
    usuario_data = UsuarioCreate(
        nome="Test User Img Fail", email="testimgfail@example.com", senha="password123"
    )
    mock_db_session.query(Usuario).filter(
        Usuario.email == usuario_data.email
    ).first.return_value = None

    def side_effect_refresh(obj):
        obj.id = 1  # Simulate ID assignment

    mock_db_session.refresh.side_effect = side_effect_refresh

    with patch("src.services.user_service.hash_password", return_value="hashed_password"), \
            patch("src.services.user_service.save_user_image", side_effect=Exception("Save failed")):
        new_usuario = create_usuario(usuario_data, mock_db_session, image=mock_upload_file)

    assert new_usuario.foto_perfil is None  # Or whatever the default is
    mock_db_session.rollback.assert_called_once()
    assert mock_db_session.commit.call_count == 1  # Only the first commit for user creation


# Testes para authenticate_usuario
def test_authenticate_usuario_success(mock_db_session):
    credentials = LoginSchema(email="test@example.com", senha="password123")
    db_usuario_mock = Usuario(
        id=1,
        email="test@example.com",
        senha_hash="hashed_password",
        nome="Test User",
    )
    mock_db_session.query(Usuario).filter(
        Usuario.email == credentials.email
    ).first.return_value = db_usuario_mock

    with patch("src.services.user_service.verify_password", return_value=True):
        authenticated_user = authenticate_usuario(credentials, mock_db_session)

    assert authenticated_user == db_usuario_mock


def test_authenticate_usuario_email_not_found(mock_db_session):
    credentials = LoginSchema(email="notfound@example.com", senha="password123")
    mock_db_session.query(Usuario).filter(
        Usuario.email == credentials.email
    ).first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        authenticate_usuario(credentials, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Email não encontrado"


def test_authenticate_usuario_incorrect_password(mock_db_session):
    credentials = LoginSchema(email="test@example.com", senha="wrongpassword")
    db_usuario_mock = Usuario(
        id=1,
        email="test@example.com",
        senha_hash="hashed_password",
        nome="Test User",
    )
    mock_db_session.query(Usuario).filter(
        Usuario.email == credentials.email
    ).first.return_value = db_usuario_mock

    with patch("src.services.user_service.verify_password", return_value=False):
        with pytest.raises(HTTPException) as exc_info:
            authenticate_usuario(credentials, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Senha incorreta"


def test_authenticate_usuario_sqlalchemy_error(mock_db_session):
    credentials = LoginSchema(email="test@example.com", senha="password123")
    mock_db_session.query(Usuario).filter(
        Usuario.email == credentials.email
    ).first.side_effect = SQLAlchemyError("DB error")

    with pytest.raises(HTTPException) as exc_info:
        authenticate_usuario(credentials, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert exc_info.value.detail == "Erro no servidor ao tentar autenticar. Por favor, tente novamente mais tarde."


def test_authenticate_usuario_generic_exception(mock_db_session):
    credentials = LoginSchema(email="test@example.com", senha="password123")
    mock_db_session.query(Usuario).filter(
        Usuario.email == credentials.email
    ).first.side_effect = Exception("Unexpected error")

    with pytest.raises(HTTPException) as exc_info:
        authenticate_usuario(credentials, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert exc_info.value.detail == "Ocorreu um erro inesperado durante a autenticação."


def test_delete_usuario_success(mock_db_session: MagicMock):
    usuario_mock = Usuario(id=1, email="test@example.com", nome="Test User")

    mock_curtir_query_chain = MagicMock(name="curtir_query_chain")
    mock_curtir_filter_chain = MagicMock(name="curtir_filter_chain")
    mock_curtir_query_chain.filter.return_value = mock_curtir_filter_chain

    mock_refresh_token_query_chain = MagicMock(name="refresh_token_query_chain")
    mock_refresh_token_filter_chain = MagicMock(name="refresh_token_filter_chain")
    mock_refresh_token_query_chain.filter.return_value = mock_refresh_token_filter_chain

    def query_side_effect(model_class):
        if model_class == Curtir:
            return mock_curtir_query_chain
        elif model_class == RefreshToken:
            return mock_refresh_token_query_chain
        return MagicMock(name=f"default_query_for_{model_class}")

    mock_db_session.query.side_effect = query_side_effect

    response = delete_usuario(usuario_mock, mock_db_session)

    mock_db_session.query.assert_any_call(Curtir)
    mock_db_session.query.assert_any_call(RefreshToken)

    # Para Curtir:
    # Usar um captor ou verificar as propriedades do argumento
    # Opção 1: Usar ANY se a estrutura exata do filtro não for crítica aqui
    # mock_curtir_query_chain.filter.assert_called_once_with(ANY)

    # Opção 2: Capturar e inspecionar (mais robusto)
    # Verifica se filter foi chamado uma vez. O argumento será o primeiro da lista call_args_list
    mock_curtir_query_chain.filter.assert_called_once()
    called_filter_arg_curtir = mock_curtir_query_chain.filter.call_args[0][0]
    assert isinstance(called_filter_arg_curtir, BinaryExpression)
    # Você pode adicionar verificações mais específicas sobre 'called_filter_arg_curtir'
    # Por exemplo, comparando as strings, ou inspecionando 'left' e 'right'
    # Para uma comparação mais simples, mas geralmente eficaz:
    assert str(called_filter_arg_curtir) == str(Curtir.id_usuario == usuario_mock.id)
    mock_curtir_filter_chain.delete.assert_called_once()

    # Para RefreshToken:
    mock_refresh_token_query_chain.filter.assert_called_once()
    called_filter_arg_refresh = mock_refresh_token_query_chain.filter.call_args[0][0]
    assert isinstance(called_filter_arg_refresh, BinaryExpression)
    assert str(called_filter_arg_refresh) == str(RefreshToken.usuario_id == usuario_mock.id)
    mock_refresh_token_filter_chain.delete.assert_called_once()

    mock_db_session.delete.assert_called_once_with(usuario_mock)
    mock_db_session.commit.assert_called_once()
    assert response == {"detail": f"Usuário {usuario_mock.email} e curtidas removidos com sucesso"}

def test_delete_usuario_exception(mock_db_session):
    usuario_mock = Usuario(id=1, email="test@example.com", nome="Test User")
    mock_db_session.delete.side_effect = Exception("DB delete error")

    with pytest.raises(HTTPException) as exc_info:
        delete_usuario(usuario_mock, mock_db_session)
    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert exc_info.value.detail == "Erro ao deletar usuário."
    mock_db_session.rollback.assert_called_once()


# Testes para update_usuario
@pytest.fixture
def existing_user_for_update():
    return Usuario(
        id=1,
        nome="Old Name",
        email="old@example.com",
        senha_hash="old_hashed_password",
    )


def test_update_usuario_nome_success(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(nome="New Name")

    response = update_usuario(existing_user_for_update, mock_db_session, update_data)

    assert existing_user_for_update.nome == "New Name"
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(existing_user_for_update)
    assert response.nome == "New Name"
    assert response.email == "old@example.com"


def test_update_usuario_email_success(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(email="new@example.com")
    mock_db_session.query(Usuario).filter(Usuario.email == "new@example.com").first.return_value = None

    response = update_usuario(existing_user_for_update, mock_db_session, update_data)

    assert existing_user_for_update.email == "new@example.com"
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(existing_user_for_update)
    assert response.nome == "Old Name"
    assert response.email == "new@example.com"


def test_update_usuario_senha_success(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(senha="newpassword")
    with patch("src.services.user_service.verify_password", return_value=False), \
            patch("src.services.user_service.hash_password", return_value="new_hashed_password"):
        response = update_usuario(existing_user_for_update, mock_db_session, update_data)

    assert existing_user_for_update.senha_hash == "new_hashed_password"
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(existing_user_for_update)
    assert response.nome == "Old Name"
    assert response.email == "old@example.com"


def test_update_usuario_no_changes(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(nome="Old Name", email="old@example.com")  # No actual change

    # Mock verify_password if senha was provided and matched
    # with patch("src.services.user_service.verify_password", return_value=True):
    response = update_usuario(existing_user_for_update, mock_db_session, update_data)

    mock_db_session.commit.assert_not_called()
    mock_db_session.refresh.assert_not_called()
    assert response.nome == "Old Name"
    assert response.email == "old@example.com"


def test_update_usuario_nome_empty(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(nome=" ")
    with pytest.raises(HTTPException) as exc_info:
        update_usuario(existing_user_for_update, mock_db_session, update_data)
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert exc_info.value.detail == "Nome não pode ser vazio"
    mock_db_session.rollback.assert_called_once()


def test_update_usuario_email_exists(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(email="taken@example.com")
    mock_db_session.query(Usuario).filter(Usuario.email == "taken@example.com").first.return_value = Usuario(id=2,
                                                                                                             email="taken@example.com")

    with pytest.raises(HTTPException) as exc_info:
        update_usuario(existing_user_for_update, mock_db_session, update_data)
    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert exc_info.value.detail == "Email já cadastrado"
    mock_db_session.rollback.assert_called_once()


def test_update_usuario_senha_empty(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(senha=" ")
    with pytest.raises(HTTPException) as exc_info:
        update_usuario(existing_user_for_update, mock_db_session, update_data)
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert exc_info.value.detail == "Senha não pode ser vazia"
    mock_db_session.rollback.assert_called_once()


def test_update_usuario_generic_exception(mock_db_session, existing_user_for_update):
    update_data = UpdateUsuario(nome="New Name")
    mock_db_session.commit.side_effect = Exception("DB commit error")

    with pytest.raises(HTTPException) as exc_info:
        update_usuario(existing_user_for_update, mock_db_session, update_data)
    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert exc_info.value.detail == "Erro ao atualizar usuário."
    mock_db_session.rollback.assert_called_once()
