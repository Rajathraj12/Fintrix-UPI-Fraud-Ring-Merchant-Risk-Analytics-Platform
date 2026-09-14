import logging
import socket
from datetime import datetime
from pathlib import Path

# Project root = folder above src/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOGS_DIR = PROJECT_ROOT / "logs"

# Make sure the logs folder exists.
LOGS_DIR.mkdir(parents=True, exist_ok=True)

DEVICE_NAME = socket.gethostname()
LOG_FILE = (
    f"{DEVICE_NAME}_"
    f"{datetime.now().strftime('%m_%d_%Y_%H_%M_%S')}.log"
)

LOG_FILE_PATH = LOGS_DIR / LOG_FILE

logging.basicConfig(
    filename=LOG_FILE_PATH,
    format=(
        "[%(asctime)s] "
        "line %(lineno)d "
        "%(name)s - "
        "%(levelname)s - "
        "%(message)s"
    ),
    level=logging.INFO,
)