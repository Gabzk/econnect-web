# tests/test_rss_service.py
import pytest
from unittest.mock import patch, MagicMock, call
from datetime import datetime
import asyncio  # Necessário para pytest.mark.asyncio se não usar pytest-asyncio diretamente

# Importar funções e classes do módulo em teste
from src.services.rss_service import gerar_resumo, limpar_texto, get_news_from_rss
from src.db.models.fonte_model import Fonte
from src.db.models.noticia_model import Noticia


# from src.utils.parse_date import parse_date # Será mockado na maioria dos testes de get_news_from_rss

# Estruturas de mock para simular o comportamento do spaCy nlp
class MockSpan:
    def __init__(self, text):
        self.text = text


class MockDoc:
    def __init__(self, sents_text):
        self.sents = [MockSpan(text) for text in sents_text]


class TestRssService:

    # --- Testes para gerar_resumo ---
    @patch('src.services.rss_service.nlp')
    def test_gerar_resumo_texto_normal(self, mock_nlp):
        mock_nlp.return_value = MockDoc(["Primeira frase.", "Segunda frase.", "Terceira frase longa."])
        texto = "Primeira frase. Segunda frase. Terceira frase longa."
        # "Primeira frase." (16)
        # "Primeira frase. Segunda frase." (16 + 1 + 14 = 31)
        resumo = gerar_resumo(texto, max_length=30)
        assert resumo == "Primeira frase. Segunda frase."

    @patch('src.services.rss_service.nlp')
    def test_gerar_resumo_texto_cabe_exatamente(self, mock_nlp):
        mock_nlp.return_value = MockDoc(["Frase curta.", "Outra."])
        texto = "Frase curta. Outra."  # 12 + 1 + 6 = 19
        resumo = gerar_resumo(texto, max_length=19)
        assert resumo == "Frase curta. Outra."

    @patch('src.services.rss_service.nlp')
    def test_gerar_resumo_texto_vazio(self, mock_nlp):
        resumo = gerar_resumo("   ", max_length=50)
        assert resumo == "Resumo indisponível"
        mock_nlp.assert_not_called()

    @patch('src.services.rss_service.nlp')
    def test_gerar_resumo_texto_curto_menor_que_max(self, mock_nlp):
        mock_nlp.return_value = MockDoc(["Texto curto."])
        texto = "Texto curto."
        resumo = gerar_resumo(texto, max_length=50)
        assert resumo == "Texto curto."

    @patch('src.services.rss_service.nlp')
    def test_gerar_resumo_texto_longo_truncado_na_sentenca(self, mock_nlp):
        sents = ["Esta é a primeira sentença.", "Esta é a segunda que é um pouco mais longa.",
                 "Esta terceira não deve caber."]
        mock_nlp.return_value = MockDoc(sents)
        texto = " ".join(sents)  # "Esta é a primeira sentença." (28 chars)
        resumo = gerar_resumo(texto, max_length=40)
        assert resumo == "Esta é a primeira sentença."

    @patch('src.services.rss_service.nlp')
    def test_gerar_resumo_fallback_corte_brusco(self, mock_nlp):
        # Teste para o caso de fallback: return texto[: max_length - 3] + "..."
        # Ocorre se a primeira sentença já for maior que max_length.
        long_sentence = "Esta é uma sentença única muito longa que excede o comprimento máximo."  # 70 chars
        mock_nlp.return_value = MockDoc([long_sentence])
        texto = long_sentence
        resumo = gerar_resumo(texto, max_length=30)
        assert resumo == texto[:27] + "..."
        assert len(resumo) == 30

    # --- Testes para limpar_texto ---
    def test_limpar_texto_com_summary(self):
        entry = {"summary": "<p>Este é um resumo.</p>Mais texto."}
        assert limpar_texto(entry) == "Este é um resumo. Mais texto."

    def test_limpar_texto_com_description_sem_summary(self):
        entry = {"description": "  <h1>Descrição</h1> texto.  "}
        assert limpar_texto(entry) == "Descrição texto."

    def test_limpar_texto_com_content_sem_summary_description(self):
        entry = {"content": [{"value": "<div>Conteúdo <span>aqui</span></div>"}]}
        assert limpar_texto(entry) == "Conteúdo aqui"

    def test_limpar_texto_com_content_lista_vazia_ou_sem_valor(self):
        assert limpar_texto({"content": []}) == ""
        assert limpar_texto({"content": [{}]}) == ""
        assert limpar_texto({"content": [{"type": "html"}]}) == ""  # sem 'value'

    def test_limpar_texto_sem_campos_relevantes(self):
        entry = {"title": "Um título", "link": "um_link"}
        assert limpar_texto(entry) == ""

    def test_limpar_texto_ordem_de_preferencia(self):
        entry_full = {
            "summary": "Summary primeiro.",
            "description": "Description segundo.",
            "content": [{"value": "Content terceiro."}]
        }
        assert limpar_texto(entry_full) == "Summary primeiro."

        entry_no_summary = {
            "description": "Description segundo.",
            "content": [{"value": "Content terceiro."}]
        }
        assert limpar_texto(entry_no_summary) == "Description segundo."

        entry_only_content = {
            "content": [{"value": "Content terceiro."}]
        }
        assert limpar_texto(entry_only_content) == "Content terceiro."

    # --- Testes para get_news_from_rss ---

    @pytest.mark.asyncio
    @patch('src.services.rss_service.feedparser.parse')
    @patch('src.services.rss_service.gerar_resumo')
    @patch('src.services.rss_service.limpar_texto')
    @patch('src.services.rss_service.parse_date')
    async def test_get_news_from_rss_sucesso(self, mock_parse_date, mock_limpar_texto, mock_gerar_resumo,
                                             mock_feedparser_parse, capsys):
        mock_db = MagicMock()
        mock_fonte = Fonte(id=1, url="http://example.com/rss", tipo_extracao="rss")
        mock_db.query(Fonte).filter().all.return_value = [mock_fonte]
        mock_db.query(Noticia).filter_by().first.return_value = None  # Sem duplicatas

        mock_feed_entry = MagicMock(name="feed_entry_mock")  # Adicionar um nome ajuda na depuração

        # Configurar atributos que são acessados diretamente em mock_feed_entry
        # Para media_content e enclosures, os itens são dicionários, então .get() neles funcionará.
        mock_feed_entry.media_content = [{"url": "http://example.com/image.jpg"}]
        mock_feed_entry.enclosures = []

        # Configurar o método .get() do mock_feed_entry
        def mock_entry_get_side_effect(key, default=None):
            if key == "link":
                return "http://example.com/news/1"
            elif key == "title":
                return "Título Teste"
            elif key == "pubDate":  # Chave crucial para a falha
                return "Tue, 25 Dec 2023 12:00:00 GMT"
            elif key == "summary":  # Usado por limpar_texto (que está mockado)
                return "Texto summary cru"
            # Para a cadeia OR de datas, garanta que os outros sejam falsos se pubDate for o desejado
            elif key in ["published", "updated", "date"]:
                return None
            # Para limpar_texto, se não estivesse mockado
            elif key == "description":
                return None
            elif key == "content":
                return []  # ou mock de conteúdo apropriado
            # print(f"Aviso: mock_feed_entry.get() chamado com chave não tratada: {key}") # Opcional para depuração
            return default

        mock_feed_entry.get.side_effect = mock_entry_get_side_effect

        # As seguintes linhas do teste original que definiam atributos diretamente não são suficientes
        # para o comportamento de .get():
        # mock_feed_entry.link = "http://example.com/news/1"
        # mock_feed_entry.title = "Título Teste"
        # mock_feed_entry.pubDate = "Tue, 25 Dec 2023 12:00:00 GMT"
        # mock_feed_entry.summary = "Texto summary cru"

        mock_feedparser_parse.return_value = MagicMock(entries=[mock_feed_entry])
        mock_limpar_texto.return_value = "Texto limpo para resumo"
        mock_gerar_resumo.return_value = "Resumo Gerado"

        # Renomeado para clareza, este é o valor que esperamos que mock_parse_date retorne
        data_parseada_configurada_no_mock = datetime(2023, 12, 25, 12, 0, 0)
        mock_parse_date.return_value = data_parseada_configurada_no_mock

        resultado = await get_news_from_rss(mock_db)

        mock_feedparser_parse.assert_called_once_with("http://example.com/rss")
        mock_limpar_texto.assert_called_once_with(mock_feed_entry)
        mock_gerar_resumo.assert_called_once_with("Texto limpo para resumo")
        # Esta é a asserção que estava falhando:
        mock_parse_date.assert_called_once_with("Tue, 25 Dec 2023 12:00:00 GMT")

        assert mock_db.add.call_count == 1
        noticia_adicionada_arg = mock_db.add.call_args[0][0]
        assert isinstance(noticia_adicionada_arg, Noticia)
        assert noticia_adicionada_arg.titulo == "Título Teste"
        assert noticia_adicionada_arg.resumo == "Resumo Gerado"
        assert noticia_adicionada_arg.imagem == "http://example.com/image.jpg"
        assert noticia_adicionada_arg.url == "http://example.com/news/1"
        assert noticia_adicionada_arg.id_fonte == 1
        assert noticia_adicionada_arg.data_postagem == data_parseada_configurada_no_mock  # Use o valor retornado pelo mock

        mock_db.commit.assert_called_once()
        assert resultado == {"detail": "Notícias coletadas com sucesso!"}
        captured = capsys.readouterr()
        assert "✅ Notícia adicionada: Título Teste" in captured.out

    @pytest.mark.asyncio
    async def test_get_news_from_rss_sem_fontes(self):
        mock_db = MagicMock()
        mock_db.query(Fonte).filter().all.return_value = []

        with pytest.raises(ValueError, match="Nenhuma fonte de RSS encontrada."):
            await get_news_from_rss(mock_db)
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    @patch('src.services.rss_service.feedparser.parse')
    # Mantenha outros mocks se a lógica interna os chamar antes do skip
    @patch('src.services.rss_service.parse_date')
    @patch('src.services.rss_service.gerar_resumo')
    @patch('src.services.rss_service.limpar_texto')
    async def test_get_news_from_rss_noticia_duplicada_pulada(self, mock_limpar, mock_gerar, mock_parse,
                                                              mock_feedparser_parse, capsys):
        mock_db = MagicMock()
        mock_fonte = Fonte(id=1, url="http://example.com/rss", tipo_extracao="rss")
        mock_db.query(Fonte).filter().all.return_value = [mock_fonte]

        # Configura o mock para simular uma notícia existente com a URL específica
        # A consulta no código é db.query(Noticia).filter_by(url=url).first()
        # Precisamos garantir que essa consulta retorne algo quando a URL for a duplicada.
        # E None para outras URLs (se houvesse outras notícias não duplicadas no mesmo feed).
        def filter_by_side_effect(url):
            if url == "http://example.com/news/duplicate":
                return MagicMock(first=lambda: Noticia())  # Retorna uma instância de Noticia
            return MagicMock(first=lambda: None)  # Retorna None para outras URLs

        mock_db.query(Noticia).filter_by.side_effect = filter_by_side_effect

        # mock_db.query(Noticia).filter_by(
        #     url="http://example.com/news/duplicate").first.return_value = Noticia() # Linha original, pode ser simplificada como acima

        mock_feed_entry_duplicate = MagicMock(name="feed_entry_duplicate_mock")
        # Configure o método .get() para retornar a URL correta
        mock_feed_entry_duplicate.get.side_effect = lambda key, default=None: "http://example.com/news/duplicate" if key == "link" else default
        # Alternativamente, se apenas 'link' for usado por .get() neste mock:
        # mock_feed_entry_duplicate.get.return_value = "http://example.com/news/duplicate"
        # No entanto, side_effect é mais robusto se outras chaves fossem chamadas com .get()

        # Definir o atributo title ainda é útil se o código o acessa diretamente
        mock_feed_entry_duplicate.title = "Duplicada"

        mock_feedparser_parse.return_value = MagicMock(entries=[mock_feed_entry_duplicate])

        await get_news_from_rss(mock_db)

        captured = capsys.readouterr()
        assert "🚫 Notícia duplicada: http://example.com/news/duplicate" in captured.out
        mock_db.add.assert_not_called()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    @patch('src.services.rss_service.feedparser.parse')
    @patch('src.services.rss_service.BeautifulSoup')  # Mockar BeautifulSoup para extração de imagem
    @patch('src.services.rss_service.parse_date')
    @patch('src.services.rss_service.gerar_resumo')
    @patch('src.services.rss_service.limpar_texto')
    async def test_get_news_from_rss_sem_imagem_pulada(self, mock_limpar, mock_gerar, mock_parse_dt, mock_bs,
                                                       mock_feedparser_parse, capsys):
        mock_db = MagicMock()
        mock_fonte = Fonte(id=1, url="http://example.com/rss", tipo_extracao="rss")
        mock_db.query(Fonte).filter().all.return_value = [mock_fonte]
        mock_db.query(Noticia).filter_by().first.return_value = None  # Sem duplicatas

        mock_feed_entry_no_image = MagicMock(
            link="http://example.com/news/no_image", title="Sem Imagem",
            media_content=[], enclosures=[], summary="<p>sumário</p>", content=[],  # Sem imagem nos campos diretos
            pubDate="some_date"
        )
        # Configurar mock do BeautifulSoup para não encontrar <img>
        mock_soup_instance = MagicMock()
        mock_soup_instance.find.return_value = None  # Nenhuma tag <img> encontrada
        mock_bs.return_value = mock_soup_instance

        mock_feedparser_parse.return_value = MagicMock(entries=[mock_feed_entry_no_image])
        mock_parse_dt.return_value = datetime.now()

        await get_news_from_rss(mock_db)

        captured = capsys.readouterr()
        assert "🚫 Notícia sem imagem. Pulando..." in captured.out
        mock_db.add.assert_not_called()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    @patch('src.services.rss_service.feedparser.parse')
    @patch('src.services.rss_service.parse_date')
    @patch('src.services.rss_service.gerar_resumo')
    @patch('src.services.rss_service.limpar_texto')
    @patch('src.services.rss_service.BeautifulSoup')
    async def test_get_news_from_rss_variantes_extracao_imagem(self, mock_BeautifulSoup, mock_limpar, mock_gerar,
                                                               mock_parse_dt, mock_feedparser_parse):
        mock_db = MagicMock()
        mock_fonte = Fonte(id=1, url="http://example.com/rss", tipo_extracao="rss")
        mock_db.query(Fonte).filter().all.return_value = [mock_fonte]

        # Configura o mock para simular que nenhuma notícia é duplicada
        def filter_by_side_effect(url):
            return MagicMock(first=lambda: None)

        mock_db.query(Noticia).filter_by.side_effect = filter_by_side_effect

        # Use uma data fixa para previsibilidade
        fixed_date = datetime(2024, 1, 2, 10, 30, 0)
        mock_parse_dt.return_value = fixed_date
        mock_limpar.return_value = "Texto Limpo"
        mock_gerar.return_value = "Resumo Gerado"

        # Define entry mocks e configure seus métodos .get()
        entry_media = MagicMock(name="entry_media_mock")
        entry_media.get.side_effect = lambda key, default=None: {
            "link": "u_media",
            "title": "T_Media",
            "pubDate": "d_m",
            "summary": "s_m",
            "content": [],
            "published": None,
            "updated": None,
            "date": None,
            "description": None,
        }.get(key, default)
        entry_media.media_content = [{"url": "img_media.jpg"}]  # Acessado diretamente
        entry_media.enclosures = []  # Acessado diretamente

        entry_enclosure = MagicMock(name="entry_enclosure_mock")
        entry_enclosure.get.side_effect = lambda key, default=None: {
            "link": "u_enc",
            "title": "T_Enc",
            "pubDate": "d_e",
            "summary": "s_e",
            "content": [],
            "published": None,
            "updated": None,
            "date": None,
            "description": None,
        }.get(key, default)
        entry_enclosure.media_content = []  # Acessado diretamente
        entry_enclosure.enclosures = [{"href": "img_enclosure.jpg"}]  # Acessado diretamente

        entry_html_content = MagicMock(name="entry_html_content_mock")
        entry_html_content.get.side_effect = lambda key, default=None: {
            "link": "u_html_c",
            "title": "T_HTML_C",
            "pubDate": "d_hc",
            "summary": "s_hc",
            "content": [{"value": "<div><img src='img_html_content.jpg'></div>"}],
            "published": None,
            "updated": None,
            "date": None,
            "description": None,
        }.get(key, default)
        entry_html_content.media_content = []  # Acessado diretamente
        entry_html_content.enclosures = []  # Acessado diretamente

        entry_html_summary = MagicMock(name="entry_html_summary_mock")
        entry_html_summary.get.side_effect = lambda key, default=None: {
            "link": "u_html_s",
            "title": "T_HTML_S",
            "pubDate": "d_hs",
            "summary": "<p><img src='img_html_summary.jpg'></p>",
            "content": [],
            "published": None,
            "updated": None,
            "date": None,
            "description": None,
        }.get(key, default)
        entry_html_summary.media_content = []  # Acessado diretamente
        entry_html_summary.enclosures = []  # Acessado diretamente

        mock_feedparser_parse.return_value = MagicMock(
            entries=[entry_media, entry_enclosure, entry_html_content, entry_html_summary])

        # BeautifulSoup side_effect permanece o mesmo
        def bs_side_effect(html_str, parser):
            soup_mock = MagicMock()
            img_tag = MagicMock()
            img_tag.has_attr.return_value = True
            if html_str == "<div><img src='img_html_content.jpg'></div>":
                img_tag.__getitem__.return_value = 'img_html_content.jpg'
                soup_mock.find.return_value = img_tag
            elif html_str == "<p><img src='img_html_summary.jpg'></p>":
                img_tag.__getitem__.return_value = 'img_html_summary.jpg'
                soup_mock.find.return_value = img_tag
            else:
                soup_mock.find.return_value = None
            return soup_mock

        mock_BeautifulSoup.side_effect = bs_side_effect

        await get_news_from_rss(mock_db)

        # Asserções
        assert mock_db.add.call_count == 4
        added_noticias = [args[0][0] for args in mock_db.add.call_args_list]

        # Verificar detalhes das notícias adicionadas
        assert len(added_noticias) == 4
        assert added_noticias[0].url == "u_media"
        assert added_noticias[0].imagem == "img_media.jpg"
        assert added_noticias[0].data_postagem == fixed_date
        assert added_noticias[1].url == "u_enc"
        assert added_noticias[1].imagem == "img_enclosure.jpg"
        assert added_noticias[1].data_postagem == fixed_date
        assert added_noticias[2].url == "u_html_c"
        assert added_noticias[2].imagem == "img_html_content.jpg"
        assert added_noticias[2].data_postagem == fixed_date
        assert added_noticias[3].url == "u_html_s"
        assert added_noticias[3].imagem == "img_html_summary.jpg"
        assert added_noticias[3].data_postagem == fixed_date

        # Verificar se outros mocks foram chamados como esperado
        mock_feedparser_parse.assert_called_once_with("http://example.com/rss")
        assert mock_limpar.call_count == 4  # Chamado uma vez por entrada
        assert mock_gerar.call_count == 4  # Chamado uma vez por entrada
        assert mock_parse_dt.call_count == 4  # Chamado uma vez para o campo de data de cada entrada

        # Verificar argumentos passados para parse_date
        mock_parse_dt.assert_has_calls([
            call("d_m"),
            call("d_e"),
            call("d_hc"),
            call("d_hs"),
        ], any_order=True)  # Use any_order=True se a ordem das entradas do feedparser não for garantida

        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    @patch('src.services.rss_service.feedparser.parse')
    async def test_get_news_from_rss_erro_feedparser(self, mock_feedparser_parse, capsys):
        mock_db = MagicMock()
        mock_fonte = Fonte(id=1, url="http://example.com/rss_erro", tipo_extracao="rss")
        mock_db.query(Fonte).filter().all.return_value = [mock_fonte]
        mock_feedparser_parse.side_effect = Exception("Erro de rede no Feedparser")

        resultado = await get_news_from_rss(mock_db)

        # A exceção é capturada dentro do loop, então a função completa.
        mock_db.add.assert_not_called()
        mock_db.commit.assert_called_once()
        assert resultado == {"detail": "Notícias coletadas com sucesso!"}
        captured = capsys.readouterr()
        assert "Erro ao processar notícia: Erro de rede no Feedparser" in captured.out

    @pytest.mark.asyncio
    @patch('src.services.rss_service.feedparser.parse')
    @patch('src.services.rss_service.parse_date')
    @patch('src.services.rss_service.gerar_resumo')
    @patch('src.services.rss_service.limpar_texto')
    @patch('src.services.rss_service.datetime')  # Mockar o módulo datetime
    async def test_get_news_from_rss_data_padrao_se_ausente_no_feed(self, mock_datetime_module, mock_limpar, mock_gerar,
                                                                    mock_parse_dt, mock_feedparser_parse):
        mock_db = MagicMock()
        mock_fonte = Fonte(id=1, url="http://example.com/rss", tipo_extracao="rss")
        mock_db.query(Fonte).filter().all.return_value = [mock_fonte]
        mock_db.query(Noticia).filter_by().first.return_value = None

        fixed_now = datetime(2024, 1, 1, 12, 0, 0)
        mock_datetime_module.now.return_value = fixed_now  # datetime.now() será fixed_now
        # Assumir que parse_date retorna a data como está se já for datetime, ou processa a string
        mock_parse_dt.return_value = fixed_now  # parse_date(str(fixed_now)) -> fixed_now

        mock_feed_entry = MagicMock(
            link="u1", title="T1", media_content=[{"url": "img.jpg"}], enclosures=[], summary="s1", content=[]
        )
        # Garantir que os campos de data não existem no mock_feed_entry
        for attr in ['pubDate', 'published', 'updated', 'date']:
            if hasattr(mock_feed_entry, attr):
                delattr(mock_feed_entry, attr)

        # Para MagicMock, se um atributo não existe, acessá-lo pode criar um novo MagicMock.
        # Para simular ausência, podemos fazer o get retornar None.
        def get_side_effect(key, default=None):
            if key in ['pubDate', 'published', 'updated', 'date']:
                return None
            # Comportamento padrão para outros atributos
            return getattr(mock_feed_entry, key, default) if hasattr(mock_feed_entry, key) else default

        mock_feed_entry.get.side_effect = get_side_effect

        mock_feedparser_parse.return_value = MagicMock(entries=[mock_feed_entry])
        mock_limpar.return_value = "Limpo"
        mock_gerar.return_value = "Resumo"

        await get_news_from_rss(mock_db)

        mock_parse_dt.assert_called_once_with(str(fixed_now))
        added_noticia = mock_db.add.call_args[0][0]
        assert added_noticia.data_postagem == fixed_now
        mock_db.commit.assert_called_once()
