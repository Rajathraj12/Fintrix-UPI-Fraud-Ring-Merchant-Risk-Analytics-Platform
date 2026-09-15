"""
Fintrix AI Main Entrypoint.
Re-exports the production FastAPI app from app.api.main.
"""
from .api.main import app, create_app

__all__ = ["app", "create_app"]
