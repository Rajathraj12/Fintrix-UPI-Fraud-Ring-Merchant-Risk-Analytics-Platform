"""
FastAPI application factory and configuration for Fintrix AI REST API (Phase 7).
"""
import os
import logging
from typing import List
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .routes import router
from .schemas import ErrorResponse, ErrorDetail

logger = logging.getLogger("fintrix_ai.api")


def get_allowed_origins() -> List[str]:
    """
    Parse allowed origins from environment variable or apply local dev defaults.
    """
    env_origins = os.getenv("ALLOWED_ORIGINS", "")
    if env_origins.strip():
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8443",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8443",
    ]


def create_app() -> FastAPI:
    """
    Instantiate and configure the FastAPI application.
    """
    app = FastAPI(
        title="Fintrix AI — Conversational Financial Intelligence API",
        description=(
            "Production-grade REST API exposing the Fintrix AI agent layer for UPI payment analytics, "
            "forensic risk scoring, customer & merchant intelligence, and dispute resolution."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # 1. CORS Configuration
    origins = get_allowed_origins()
    logger.info(f"Configured CORS allowed origins: {origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # 2. Validation Exception Handler (HTTP 422)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        error_msgs = []
        for err in errors:
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            msg = err.get("msg", "Invalid value")
            error_msgs.append(f"{loc}: {msg}")
        joined_msg = "; ".join(error_msgs) if error_msgs else "Invalid request payload."
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="VALIDATION_ERROR",
                    message=joined_msg
                )
            ).model_dump()
        )

    # 3. HTTP Exception Handler
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail and "message" in detail:
            code = detail["code"]
            msg = detail["message"]
        else:
            code = f"HTTP_{exc.status_code}"
            msg = str(detail)
            
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code=code,
                    message=msg
                )
            ).model_dump()
        )

    # 4. Generic Internal Error Handler (HTTP 500)
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="INTERNAL_SERVER_ERROR",
                    message="An unexpected internal error occurred. Please contact support."
                )
            ).model_dump()
        )

    # 5. Include API routes
    app.include_router(router)

    return app


# Default application instance for Uvicorn ASGI server
app = create_app()
