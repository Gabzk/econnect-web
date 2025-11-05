import httpx
from src.routers.user_router import user_router
from src.routers.news_router import news_router
from src.routers.auth_router import auth_router
from src.routers.home_router import home_router

from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.middleware.cors import CORSMiddleware
from src.middlewares.rate_limit_middleware import RateLimitMiddleware
from sqlalchemy.orm import configure_mappers
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging
import os


load_dotenv()

API_KEY = os.getenv("api_key")

# Configure o logging para ver o que o scheduler está fazendo
logging.basicConfig()
logging.getLogger("apscheduler").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)

configure_mappers()
scheduler = AsyncIOScheduler(timezone="UTC")


async def buscar_noticias_job():
    logger.info("APScheduler: Iniciando busca de notícias...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/news/fetch-rss",
                headers={"api_key": str(API_KEY)} if API_KEY else None,
            )
            response.raise_for_status()
            logger.info("APScheduler: Busca de notícias concluída com sucesso.")

    except httpx.HTTPStatusError as e:
        print(
            f"APScheduler (lifespan): Erro HTTP ao buscar notícias: {e.response.status_code} - {e.response.text}"
        )
    except Exception as e:
        logger.error(f"APScheduler: Erro inesperado ao buscar notícias: {e}")


# --- Gerenciador de Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código a ser executado ANTES da aplicação iniciar (startup)
    logger.info("Lifespan: Iniciando a aplicação e o scheduler...")

    scheduler.add_job(buscar_noticias_job, "interval", hours=1, id="job_busca_noticias")

    scheduler.start()

    logger.info("Lifespan: APScheduler iniciado e job agendado.")

    yield  # Este é o ponto onde a aplicação está rodando

    # Código a ser executado APÓS a aplicação finalizar (shutdown)
    logger.info("Lifespan: Finalizando a aplicação e o scheduler...")
    scheduler.shutdown()
    logger.info("Lifespan: APScheduler desligado.")


# --- Aplicação FastAPI ---
app = FastAPI(lifespan=lifespan)  # Passa a função lifespan para a app FastAPI


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)


# garante que o diretório existe
os.makedirs("static/images", exist_ok=True)

app.mount(
    "/static/images",
    StaticFiles(directory="static/images"),
    name="images",
)

app.include_router(auth_router)
app.include_router(home_router)
app.include_router(news_router)
app.include_router(user_router)
