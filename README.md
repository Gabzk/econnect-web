# Econnect Web

Agregador de notícias sobre meio ambiente com backend FastAPI e frontend Next.js.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

## 🚀 Como executar

### Desenvolvimento (com hot reload)

Ideal para desenvolver, com atualização automática ao salvar arquivos.

```bash
# Criar arquivo de ambiente
cp .env.example .env
# Editar com suas credenciais
nano .env

# Subir os containers
docker compose -f docker-compose.dev.yml up --build
```

- **Frontend**: <http://localhost:3000>
- **Backend**: <http://localhost:8000>
- **API Docs**: <http://localhost:8000/docs>

Para rodar em segundo plano, adicione `-d`:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Produção (imagem única)

Imagem otimizada com frontend e backend no mesmo container.

```bash
# Criar arquivo de ambiente de produção
cp .env.production.example .env.production
# Editar com suas credenciais reais
nano .env.production

# Build e executar
docker compose -f docker-compose.prod.yml up --build -d
```

- **Frontend**: <http://localhost> (porta 80)
- **Backend API**: <http://localhost:8000>

## 📁 Estrutura Docker

```bash
├── docker-compose.dev.yml    # Compose para desenvolvimento
├── docker-compose.prod.yml   # Compose para produção
├── Dockerfile                # Imagem unificada de produção
├── .env                      # Variáveis de ambiente (dev)
├── .env.production           # Variáveis de ambiente (prod)
├── backend/
│   └── Dockerfile.dev        # Imagem de desenvolvimento do backend
└── frontend/
    └── Dockerfile.dev        # Imagem de desenvolvimento do frontend
```

## 🔧 Comandos úteis

```bash
# Ver containers rodando
docker ps

# Ver logs em tempo real
docker logs <nome-container> -f

# Parar containers (dev)
docker compose -f docker-compose.dev.yml down

# Parar containers (prod)
docker compose -f docker-compose.prod.yml down

# Rebuild sem cache
docker compose -f docker-compose.prod.yml build --no-cache

# Limpar containers órfãos
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Acessar shell do container
docker exec -it <nome-container> /bin/bash
```

## ⚙️ Variáveis de Ambiente

Todas as variáveis ficam em um único arquivo `.env` (dev) ou `.env.production` (prod):

```env
# ===== BACKEND =====
user=postgres.seu-projeto
password=sua_senha
host=aws-0-sa-east-1.pooler.supabase.com
port=6543
dbname=postgres
jwt_secret_key=sua_chave_secreta
api_key=sua_api_key
news_key=sua_news_key

# ===== FRONTEND =====
BACKEND_URL=http://backend:8000  # dev (nome do serviço Docker)
# BACKEND_URL=http://localhost:8000  # prod (mesmo container)
API_KEY=sua_api_key
```

## 🛠️ Troubleshooting

### Container reiniciando em loop

```bash
# Ver logs de erro
docker logs <nome-container>
```
