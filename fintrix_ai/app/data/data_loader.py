from pathlib import Path
from typing import Optional, Dict
import pandas as pd

# Base workspace path resolution
WORKSPACE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class FintrixDataLoader:
    """Singleton-style cached loader for Fintrix clean datasets."""
    _instance = None
    _cache: Dict[str, pd.DataFrame] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FintrixDataLoader, cls).__new__(cls)
            cls._instance._init_paths()
        return cls._instance

    def _init_paths(self):
        candidate_dirs = [
            WORKSPACE_DIR / "data" / "processed",
            WORKSPACE_DIR / "dashboard" / "public" / "data",
            WORKSPACE_DIR / "cleaned_data"
        ]
        self.data_dir = None
        for d in candidate_dirs:
            if d.exists() and (d / "upi_transactions_clean.csv").exists():
                self.data_dir = d
                break
        if self.data_dir is None:
            # Fallback to dashboard public data
            self.data_dir = WORKSPACE_DIR / "dashboard" / "public" / "data"

    def get_transactions(self) -> pd.DataFrame:
        if "transactions" not in self._cache:
            path = self.data_dir / "upi_transactions_clean.csv"
            self._cache["transactions"] = pd.read_csv(path) if path.exists() else pd.DataFrame()
        return self._cache["transactions"]

    def get_chargebacks(self) -> pd.DataFrame:
        if "chargebacks" not in self._cache:
            path = self.data_dir / "chargebacks_clean.csv"
            self._cache["chargebacks"] = pd.read_csv(path) if path.exists() else pd.DataFrame()
        return self._cache["chargebacks"]

    def get_chargeback_summary(self) -> pd.DataFrame:
        if "chargeback_summary" not in self._cache:
            path = self.data_dir / "chargeback_transaction_summary.csv"
            self._cache["chargeback_summary"] = pd.read_csv(path) if path.exists() else pd.DataFrame()
        return self._cache["chargeback_summary"]

    def get_kyc(self) -> pd.DataFrame:
        if "kyc" not in self._cache:
            path = self.data_dir / "kyc_clean.csv"
            self._cache["kyc"] = pd.read_csv(path) if path.exists() else pd.DataFrame()
        return self._cache["kyc"]

    def get_merchants(self) -> pd.DataFrame:
        if "merchants" not in self._cache:
            path = self.data_dir / "merchants_clean.csv"
            self._cache["merchants"] = pd.read_csv(path) if path.exists() else pd.DataFrame()
        return self._cache["merchants"]

    def reload(self):
        """Clear cache to reload data from disk."""
        self._cache.clear()


# Shared loader instance
data_loader = FintrixDataLoader()
