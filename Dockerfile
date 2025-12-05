# ============================================
# DOCKERFILE UNIFICADO - BACKEND + FRONTEND
# ============================================

# ============================================
# STAGE 1: Build do Frontend (Next.js)
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Instalar dependências
COPY frontend/package*.json ./
RUN npm ci

# Copiar código e buildar
COPY frontend/ ./

# Variáveis de ambiente para o build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_INTERNAL_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_INTERNAL_API_URL=${NEXT_PUBLIC_INTERNAL_API_URL}

RUN npm run build

# ============================================
# STAGE 2: Imagem de Produção
# ============================================
FROM python:3.12-slim AS production

# Instalar Node.js e supervisord
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar Poetry
ENV POETRY_HOME=/opt/poetry
ENV PATH="${POETRY_HOME}/bin:${PATH}"
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && poetry config virtualenvs.create false

# ============================================
# Backend Setup
# ============================================
WORKDIR /app/backend

# Copiar e instalar dependências do backend
COPY backend/pyproject.toml backend/poetry.lock* ./
RUN poetry install --no-interaction --no-ansi --only main

# Copiar código do backend
COPY backend/src ./src

# ============================================
# Frontend Setup
# ============================================
WORKDIR /app/frontend

# Copiar build do Next.js
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/package.json ./
COPY --from=frontend-builder /app/frontend/public ./public

# ============================================
# Supervisor Configuration
# ============================================
WORKDIR /app

COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
user=root

[program:backend]
command=python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/backend.log
stderr_logfile=/var/log/supervisor/backend_err.log
environment=PYTHONUNBUFFERED="1"

[program:frontend]
command=npm start
directory=/app/frontend
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/frontend.log
stderr_logfile=/var/log/supervisor/frontend_err.log
environment=NODE_ENV="production"
EOF

# Criar diretórios de log
RUN mkdir -p /var/log/supervisor

# Expor portas
EXPOSE 3000 8000

# Script de inicialização
COPY <<'EOF' /app/entrypoint.sh
#!/bin/bash
set -e

# Função para aguardar o banco de dados
wait_for_db() {
    echo "Aguardando o banco de dados..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if cd /app/backend && python -c "
from src.db.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text('SELECT 1'))
" 2>/dev/null; then
            echo "Banco de dados disponível!"
            return 0
        fi
        
        echo "Tentativa $attempt/$max_attempts - Banco não disponível, aguardando..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "Erro: Banco de dados não ficou disponível após $max_attempts tentativas"
    return 1
}

# Aguardar banco de dados
wait_for_db

# Iniciar supervisor (gerencia backend e frontend)
echo "Iniciando aplicação..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
