from passlib.context import CryptContext

# Configurando argon2 como algoritmo de hash
password_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hasheia a senha usando o algoritmo argon2.
    
    args:
    - password (str): A senha a ser hasheada.

    returns:
    - str: A senha hasheada.
    """

    return password_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto plano corresponde à senha hasheada.
    
    args:
    - plain_password (str): A senha em texto plano.
    - hashed_password (str): A senha hasheada.

    returns:
    - bool: True se as senhas corresponderem, False caso contrário.
    """

    return password_context.verify(plain_password, hashed_password)