from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse


class UploadLimitMiddleware:
    """Bound multipart bytes before Starlette can spool an unbounded upload."""
    def __init__(self, app, max_bytes):
        self.app, self.max_bytes = app, max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("path") != "/api/scan/upload":
            return await self.app(scope, receive, send)
        headers = dict(scope.get("headers", []))
        try:
            too_large = int(headers.get(b"content-length", b"0")) > self.max_bytes
        except ValueError:
            too_large = True
        if too_large:
            return await JSONResponse({"detail": "Upload request exceeds size limit"}, status_code=413)(scope, receive, send)
        total = 0

        async def bounded_receive():
            nonlocal total
            message = await receive()
            total += len(message.get("body", b""))
            if total > self.max_bytes:
                raise HTTPException(413, "Upload request exceeds size limit")
            return message

        await self.app(scope, bounded_receive, send)
