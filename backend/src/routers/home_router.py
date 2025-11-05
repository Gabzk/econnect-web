from fastapi.responses import HTMLResponse
from fastapi import APIRouter

home_router= APIRouter(tags=["Home"])

@home_router.get("/", response_class=HTMLResponse, tags=["Home"])
def welcome():
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Econnect API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 40px auto;
                    max-width: 800px;
                    padding: 0 20px;
                    line-height: 1.6;
                }
                .container {
                    text-align: center;
                }
                .endpoints {
                    text-align: left;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Bem-vindo à API do Econnect</h1>
                <p>Esta é a documentação básica da API.</p>
                <div class="endpoints">
                    <h2>Documentações disponíveis:</h2>
                    <ul>
                        <li><a href="/docs">/docs</a> - Documentação Swagger</li>
                        <li><a href="/redoc">/redoc</a> - Documentação ReDoc</li>
                    </ul>
                </div>
            </div>
        </body>
    </html>
    """