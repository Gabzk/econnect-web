import time
from starlette.responses import JSONResponse

requests_log = {}

MAX_REQUESTS = 60
WINDOW_SECONDS = 60

class RateLimitMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            x_forwarded_for = headers.get(b"x-forwarded-for")
            if x_forwarded_for:
                client_ip = x_forwarded_for.decode().split(",")[0].strip()
            else:
                client_ip = scope.get("client")[0] if scope.get("client") else "unknown"

            now = time.time()
            request_times = requests_log.get(client_ip, [])
            request_times = [t for t in request_times if now - t < WINDOW_SECONDS]

            if len(request_times) >= MAX_REQUESTS:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests"}
                )
                await response(scope, receive, send)
                return

            request_times.append(now)
            requests_log[client_ip] = request_times

        await self.app(scope, receive, send)
