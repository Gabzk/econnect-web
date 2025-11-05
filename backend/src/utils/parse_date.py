from dateutil import parser
from datetime import timezone, timedelta
import re


# Mapeamento de meses em português para inglês
MESES_PT_EN = {
    "jan": "Jan",
    "fev": "Feb",
    "mar": "Mar",
    "abr": "Apr",
    "mai": "May",
    "jun": "Jun",
    "jul": "Jul",
    "ago": "Aug",
    "set": "Sep",
    "out": "Oct",
    "nov": "Nov",
    "dez": "Dec"
}


def traduzir_mes(data_str):
    # Regex para pegar o mês (3 letras)
    match = re.search(r"\s([A-Za-z]{3})\s", data_str)
    if match:
        mes_pt = match.group(1).lower()
        mes_en = MESES_PT_EN.get(mes_pt)
        if mes_en:
            return data_str.replace(match.group(1), mes_en)
    return data_str


def parse_date(data_str: str):
    try:
        if not data_str:
            return None

        # Traduz mês se estiver em português
        data_str = traduzir_mes(data_str)

        dt = parser.parse(data_str)

        # Se não tiver timezone, assume UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        # Converte para horário do Brasil (UTC-3)
        dt = dt.astimezone(timezone(timedelta(hours=-3)))

        return dt

    except Exception as e:
        print(f"❌ Erro ao converter data: {data_str} -> {e}")
        return None
