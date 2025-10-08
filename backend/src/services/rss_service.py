import feedparser
from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy.orm import Session

from src.db.models.fonte_model import Fonte
from src.db.models.noticia_model import Noticia

import spacy

from src.utils.parse_date import parse_date

# Carrega o modelo de linguagem do spaCy
nlp = spacy.load("pt_core_news_sm")


def gerar_resumo(texto: str, max_length=300):
    if not texto.strip():
        return "Resumo indisponível"

    doc = nlp(texto)
    resumo = ""

    for sent in doc.sents:
        # +1 para contar o espaço que será adicionado, se resumo já tiver conteúdo
        espaco = 1 if resumo else 0
        print(len(resumo))
        print(len(sent.text))
        print(espaco)
        if len(resumo) + len(sent.text) + espaco <= max_length:
            print("entrou")
            resumo += (" " if resumo else "") + sent.text
        else:
            break

    if resumo:
        return resumo
    else:
        # corta texto e adiciona reticências, garantindo max_length
        return texto[: max_length - 3] + "..."


def limpar_texto(entry):
    # Primeiro tenta pegar summary
    html = entry.get("summary")

    if not html:
        # Se summary não existe, tenta description
        html = entry.get("description")

    if not html:
        # Se description não existe, tenta content
        content = entry.get("content", [])
        if content and isinstance(content, list) and len(content) > 0:
            html = content[0].get("value", "")
        else:
            html = ""

    # Limpa o HTML e retorna o texto
    return BeautifulSoup(str(html), "html.parser").get_text(separator=" ", strip=True)


async def get_news_from_rss(db: Session):
    noticias = []  # Armazena as notícias temporariamente
    fontes = db.query(Fonte).filter(Fonte.tipo_extracao == "rss").all()

    if not fontes:
        raise ValueError("Nenhuma fonte de RSS encontrada.")

    # Faz um loop por cada fonte e parseia o RSS com feedparser
    try:
        for fonte in fontes:
            print(f"🔍 Coletando de: {fonte.url}")
            feed = feedparser.parse(fonte.url)

            # Itera em cada item do feed e transforma em uma notícia
            for entry in feed.entries:
                # Pega a URL da notícia e converte a data (se existir) para datetime.
                url = entry.get("link", "")

                #       Verifica duplicidade de noticias
                if db.query(Noticia).filter_by(url=url).first():
                    print(f"🚫 Notícia duplicada: {url}")
                    continue

                # Pega imagem, se houver media_content ou enclosures no RSS.
                imagem = None
                if hasattr(entry, "media_content") and entry.media_content:
                    imagem = entry.media_content[0].get("url")
                elif hasattr(entry, "enclosures") and entry.enclosures:
                    imagem = entry.enclosures[0].get("href")
                if not imagem:  # Se ainda não achou imagem, tenta extrair do conteúdo HTML do post usando BeautifulSoup
                    content = entry.get("content", [])
                    html_content = (
                        content[0].get("value") if content else entry.get("summary", "")
                    )
                    soup = BeautifulSoup(str(html_content), "html.parser")
                    img_tag = soup.find("img")
                    if img_tag and img_tag.has_attr("src"):  # type: ignore
                        imagem = img_tag["src"]  # type: ignore

                #       pula notícias sem imagem
                if not imagem:
                    print("🚫 Notícia sem imagem. Pulando...")
                    continue

                titulo = entry.get("title", "Sem título")  # Pega o título da notícia

                resumo = gerar_resumo(
                    limpar_texto(entry)
                )  # Gera um resumo do texto limpo

                data_postagem = (
                    entry.get("pubDate")
                    or entry.get("published")
                    or entry.get("updated")
                    or entry.get("date")
                )

                if data_postagem:
                    data_postagem = parse_date(str(data_postagem))
                else:
                    data_postagem = parse_date(str(datetime.now()))

                # Adicionar noticias  na lista
                noticias.append(
                    Noticia(
                        titulo=titulo,
                        resumo=resumo,
                        imagem=imagem,
                        data_postagem=data_postagem,
                        url=url,
                        id_fonte=fonte.id,
                    )
                )
    except Exception as e:
        print(f"Erro ao processar notícia: {e}")

    # Insere as notícias embaralhadas no banco
    for noticia in noticias:
        if len(noticia.titulo) > 200:
            print(f"❌ Titulo: {noticia.titulo}")
        if len(noticia.resumo) > 300:
            print(f"❌ Resumo: {noticia.resumo}")
           
        db.add(noticia)
        
        print(f"✅ Notícia adicionada: {noticia.titulo}")
    

    # Confirma as transações
    db.commit()

    return {"detail": "Notícias coletadas com sucesso!"}
