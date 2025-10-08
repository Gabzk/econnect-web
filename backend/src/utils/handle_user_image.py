import os
import shutil
from pathlib import Path
from fastapi import UploadFile # Supondo que você está usando FastAPI

# Função de exclusão (pode ser chamada pela função de salvar)
def delete_user_image(user_id: int):
    """
    Encontra e deleta a imagem de um usuário, independentemente da extensão.
    Não lança exceção se o arquivo não for encontrado ou a exclusão falhar, 
    apenas imprime um log.
    """
    try:
        user_dir = Path("static") / "images"
        # Usa o glob para encontrar o arquivo com qualquer extensão
        # A lista retornada por glob terá 0 ou 1 item na maioria dos casos
        for file_path in user_dir.glob(f"{user_id}.*"):
            file_path.unlink() # Remove o arquivo
            print(f"Imagem antiga {file_path.name} do usuário {user_id} foi deletada.")
    except Exception as e:
        # Apenas registra o erro em vez de parar a aplicação
        print(f"Erro não crítico ao deletar imagem antiga do usuário {user_id}: {e}")

# Função para salvar a imagem (refatorada)
def save_user_image(file: UploadFile, user_id: int) -> str:
    """
    Salva a imagem de um usuário, substituindo qualquer imagem existente.
    É eficiente em termos de memória.
    """
    # 1. Primeiro, deleta qualquer imagem antiga para evitar arquivos órfãos.
    delete_user_image(user_id)

    # 2. Define a extensão e o nome do arquivo
    if file.filename and '.' in file.filename:
        ext = file.filename.split('.')[-1]
    else:
        ext = "jpg"  # Extensão padrão
    
    filename = f"{user_id}.{ext}"
    user_dir = Path("static") / "images"
    user_dir.mkdir(parents=True, exist_ok=True)
    file_path = user_dir / filename

    # 3. Salva o arquivo em chunks para ser eficiente em memória
    try:
        with open(file_path, "wb") as buffer:
            # shutil.copyfileobj lê o arquivo de origem e escreve no destino em pedaços
            shutil.copyfileobj(file.file, buffer)
    finally:
        # É importante fechar o arquivo de upload
        file.file.close()

    # 4. Retorna o caminho formatado para uso em URLs
    return str(file_path).replace(os.sep, "/")