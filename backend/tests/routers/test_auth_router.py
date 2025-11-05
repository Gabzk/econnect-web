# tests/test_auth_router.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.main import app  # Sua instância principal do FastAPI
from src.middlewares.rate_limit_middleware import RateLimitMiddleware
from src.db.database import Base, get_db
from src.auth.api_key import verify_api_key
from src.db.models.usuario_model import Usuario  # Modelo SQLAlchemy do Usuário
from src.db.models.refresh_tokens_model import RefreshToken # Modelo SQLAlchemy do RefreshToken
from src.auth.jwt import SECRET_KEY, ALGORITHM
from jose import jwt as jose_jwt
from datetime import datetime, timedelta
import io # Para simular UploadFile

# Configuração do banco de dados de teste em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Sobrescrever dependências para testes
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

async def override_verify_api_key():
    return True

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[verify_api_key] = override_verify_api_key

# --- MODIFICAÇÃO DA APP PARA TESTES ---
filtered_user_middleware = [
    m for m in app.user_middleware if m.cls is not RateLimitMiddleware
]
if len(filtered_user_middleware) < len(app.user_middleware):
    app.user_middleware = filtered_user_middleware
    app.middleware_stack = app.build_middleware_stack()
    print("INFO: RateLimitMiddleware removido programaticamente para os testes.")
else:
    print("INFO: RateLimitMiddleware não encontrado na configuração da app (pode já ter sido omitido).")
# --- FIM DA MODIFICAÇÃO DA APP ---

client = TestClient(app)

@pytest.fixture(scope="function", autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# --- Dados de Teste ---
# Para Form data, não precisamos de um dict separado para senha, pois será enviado no mesmo payload
test_user_form_data = {"nome": "Test User", "email": "test@example.com", "senha": "password123"}
test_login_data = {"email": "test@example.com", "senha": "password123"} # Para login, ainda é JSON via Pydantic model

# --- Testes para /auth/register ---
def test_register_success_no_image():
    response = client.post("/auth/register", data=test_user_form_data) # Usar 'data' para Form
    assert response.status_code == 200
    data = response.json()
    assert data["sucess"] is True
    assert data["message"] == "Cadastro efetuado com sucesso"

    db = TestingSessionLocal()
    user_in_db = db.query(Usuario).filter(Usuario.email == test_user_form_data["email"]).first()
    assert user_in_db is not None
    assert user_in_db.nome == test_user_form_data["nome"]
    assert user_in_db.foto_perfil is None # Verifica se a foto não foi salva
    db.close()

def test_register_success_with_image():
    # Simular um arquivo de imagem
    image_content = b"fakeimagedata"
    files = {"image": ("test_image.png", io.BytesIO(image_content), "image/png")}

    response = client.post("/auth/register", data=test_user_form_data, files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["sucess"] is True
    assert data["message"] == "Cadastro efetuado com sucesso"

    db = TestingSessionLocal()
    user_in_db = db.query(Usuario).filter(Usuario.email == test_user_form_data["email"]).first()
    assert user_in_db is not None
    assert user_in_db.nome == test_user_form_data["nome"]
    # Aqui você precisaria verificar se user_in_db.foto_perfil contém o caminho/nome esperado
    # Isso depende de como sua função create_usuario salva a imagem e armazena o caminho.
    # Exemplo: assert "test_image.png" in user_in_db.foto_perfil
    assert user_in_db.foto_perfil is not None
    db.close()
    # Adicional: Limpar o arquivo de imagem se ele for salvo no sistema de arquivos durante o teste.
    # Isso depende da sua lógica de salvamento de imagem.

def test_register_existing_email():
    client.post("/auth/register", data=test_user_form_data) # Registra o primeiro usuário
    # Tenta registrar com o mesmo email
    response = client.post("/auth/register", data={"nome": "Another User", "email": test_user_form_data["email"], "senha": "anotherpassword"})
    assert response.status_code == 409
    data = response.json()
    assert "Email já cadastrado" in data.get("detail", "")

# --- Testes para /auth/login ---
# (Seus testes de login permanecem os mesmos, pois /auth/login espera JSON)
def test_login_success():
    client.post("/auth/register", data=test_user_form_data) # Garante que o usuário exista
    response = client.post("/auth/login", json=test_login_data) # Login usa JSON
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_email():
    response = client.post("/auth/login", json={"email": "wrong@example.com", "senha": "password123"})
    assert response.status_code == 401
    data = response.json()
    assert "Email não encontrado" in data.get("detail", "")

def test_login_invalid_password():
    client.post("/auth/register", data=test_user_form_data)
    response = client.post("/auth/login", json={"email": test_user_form_data["email"], "senha": "wrongpassword"})
    assert response.status_code == 401
    data = response.json()
    assert "Senha incorreta" in data.get("detail", "")

# --- Testes para /auth/refresh ---
# (Seus testes de refresh token permanecem os mesmos)
def test_refresh_token_success():
    client.post("/auth/register", data=test_user_form_data)
    login_response = client.post("/auth/login", json=test_login_data)
    original_tokens = login_response.json()
    original_refresh_token = original_tokens["refresh_token"]
    original_access_token = original_tokens["access_token"]

    refresh_response = client.post("/auth/refresh", params={"refresh_token": original_refresh_token})
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert repr(new_tokens['access_token']) != {repr(original_access_token)}
    assert repr(new_tokens['refresh_token']) != {repr(original_refresh_token)}
    assert new_tokens["refresh_token"] != original_refresh_token, \
        f"Falha na asserção: new_token ({repr(new_tokens['refresh_token'])}) deveria ser diferente de original_token ({repr(original_refresh_token)})"

def test_refresh_token_jwt_invalid_signature():
    jwt_like_invalid_string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNzAxMDAwMDAwLCJ0eXBlIjoicmVmcmVzaCJ9.thisisnotavalidsignature"
    response = client.post("/auth/refresh", params={"refresh_token": jwt_like_invalid_string})
    assert response.status_code == 401
    data = response.json()
    assert "Token inválido:" in data.get("detail", "")

def test_refresh_token_expired_jwt():
    if not SECRET_KEY:
        pytest.fail("JWT_SECRET_KEY não está configurada para o teste.")

    payload_data = {
        "sub": "test_user_for_expired_jwt",
        "type": "refresh",
        "exp": datetime.utcnow() - timedelta(hours=1)
    }
    expired_refresh_token = jose_jwt.encode(payload_data, SECRET_KEY, algorithm=ALGORITHM)
    response = client.post("/auth/refresh", params={"refresh_token": expired_refresh_token})
    assert response.status_code == 401
    data = response.json()
    assert data.get("detail") == "Token expirado."

def test_refresh_token_not_in_db_or_revoked():
    client.post("/auth/register", data=test_user_form_data)
    login_response = client.post("/auth/login", json=test_login_data)
    valid_tokens = login_response.json()
    valid_refresh_token = valid_tokens["refresh_token"]

    db = TestingSessionLocal()
    token_entry = db.query(RefreshToken).filter(RefreshToken.token == valid_refresh_token).first()
    assert token_entry is not None
    token_entry.ativo = False
    db.commit()
    db.close()

    response = client.post("/auth/refresh", params={"refresh_token": valid_refresh_token})
    assert response.status_code == 401
    data = response.json()
    assert data.get("detail") == "Invalid or revoked refresh token"

def test_refresh_token_db_entry_expired():
    client.post("/auth/register", data=test_user_form_data)
    login_response = client.post("/auth/login", json=test_login_data)
    tokens = login_response.json()
    refresh_token_str = tokens["refresh_token"]

    db = TestingSessionLocal()
    token_entry = db.query(RefreshToken).filter(RefreshToken.token == refresh_token_str).first()
    assert token_entry is not None
    token_entry.expira_em = datetime.utcnow() - timedelta(days=1)
    db.commit()
    db.close()

    response = client.post("/auth/refresh", params={"refresh_token": refresh_token_str})
    assert response.status_code == 401
    data = response.json()
    assert data.get("detail") == "Refresh token expired"
